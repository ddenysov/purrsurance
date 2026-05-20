<?php

namespace App\Console\Commands;

use App\RAG\VetDocsRag;
use Illuminate\Console\Command;
use NeuronAI\RAG\DataLoader\FileDataLoader;
use NeuronAI\RAG\Splitter\SentenceTextSplitter;
use Throwable;

class BuildVetDocsVectorStoreCommand extends Command
{
    protected $signature = 'rag:build-vet-docs
                            {--fresh : Delete the existing vector store and rebuild from scratch}';

    protected $description = 'Build a file-based vector store from veterinary textbooks in rag/';

    public function handle(): int
    {
        if (blank(config('gemini.api_key'))) {
            $this->error('GEMINI_API_KEY is not set in .env');

            return self::FAILURE;
        }

        $sourcesPath = (string) config('rag.sources_path');

        if (! is_dir($sourcesPath)) {
            $this->error("RAG sources directory does not exist: {$sourcesPath}");

            return self::FAILURE;
        }

        $txtFiles = glob($sourcesPath.'/*.txt') ?: [];

        if ($txtFiles === []) {
            $this->error("No .txt files found in {$sourcesPath}");

            return self::FAILURE;
        }

        $this->info('Loading and chunking documents...');

        try {
            $loader = new FileDataLoader($sourcesPath);
            $loader->withSplitter(new SentenceTextSplitter(
                maxWords: (int) config('rag.chunk.max_words'),
                overlapWords: (int) config('rag.chunk.overlap_words'),
            ));

            $documents = $loader->getDocuments();
        } catch (Throwable $exception) {
            $this->error('Failed to load documents: '.$exception->getMessage());

            return self::FAILURE;
        }

        if ($documents === []) {
            $this->error('No document chunks were produced. Check rag/ files and chunk settings.');

            return self::FAILURE;
        }

        $rag = VetDocsRag::make();
        $storePath = $rag->storeFilePath();
        $fresh = (bool) $this->option('fresh');

        if ($fresh && file_exists($storePath)) {
            unlink($storePath);
            $this->warn('Removed existing vector store.');
        }

        $this->info(sprintf(
            'Indexing %d chunks from %d files into %s',
            count($documents),
            count($txtFiles),
            $storePath,
        ));
        $this->line('Embedding model: '.config('rag.embeddings.model'));
        $this->newLine();

        $useFreshBuild = $fresh || ! file_exists($storePath);

        $bar = $this->output->createProgressBar($useFreshBuild ? count($documents) : 1);
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% %message%');
        $bar->setMessage('embedding...');
        $bar->start();

        try {
            if ($useFreshBuild) {
                $batchSize = 10;

                foreach (array_chunk($documents, $batchSize) as $chunk) {
                    $rag->addDocuments($chunk, $batchSize);
                    $bar->advance(count($chunk));
                }
            } else {
                $rag->reindexBySource($documents);
                $bar->advance();
            }
        } catch (Throwable $exception) {
            $bar->finish();
            $this->newLine(2);
            $this->error('Failed to build vector store: '.$exception->getMessage());

            return self::FAILURE;
        }

        $bar->finish();
        $this->newLine(2);
        $this->info('Vector store built successfully.');
        $this->line("Store file: {$storePath}");

        return self::SUCCESS;
    }
}
