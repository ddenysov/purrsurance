<?php

namespace App\Console\Commands;

use App\RAG\VetDocsRag;
use Illuminate\Console\Command;
use NeuronAI\RAG\DataLoader\FileDataLoader;
use NeuronAI\RAG\Document;
use NeuronAI\RAG\Splitter\SentenceTextSplitter;
use Symfony\Component\Console\Helper\ProgressBar;
use Throwable;

class BuildVetDocsVectorStoreCommand extends Command
{
    private const RATE_LIMIT_WAIT_SECONDS = 120;

    private const TRANSIENT_RETRY_MAX = 10;

    private const TRANSIENT_RETRY_WAIT_SECONDS = 60;

    private const BATCH_SIZE = 10;

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

        [$pendingDocuments, $skippedChunks, $partialSources] = $this->resolvePendingDocuments(
            $documents,
            $storePath,
            $fresh,
            $rag,
        );

        $this->info(sprintf(
            'Total: %d chunks from %d files → store: %s',
            count($documents),
            count($txtFiles),
            $storePath,
        ));
        $this->line('Embedding model: '.config('rag.embeddings.model'));

        if ($skippedChunks > 0) {
            $this->line(sprintf('Resume: skipping %d chunks already indexed.', $skippedChunks));
        }

        foreach ($partialSources as $sourceName => $counts) {
            $this->line(sprintf(
                'Resume: re-indexing partial source %s (%d/%d chunks).',
                $sourceName,
                $counts['indexed'],
                $counts['expected'],
            ));
        }

        if ($pendingDocuments === []) {
            $this->newLine();
            $this->info('Vector store is already up to date. Nothing to index.');

            return self::SUCCESS;
        }

        $this->line(sprintf('Pending: %d chunks to index.', count($pendingDocuments)));
        $this->newLine();

        $bar = $this->output->createProgressBar(count($pendingDocuments));
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% — %message%');
        $bar->setMessage('working');
        $bar->start();

        try {
            foreach (array_chunk($pendingDocuments, self::BATCH_SIZE) as $chunk) {
                $this->runWithRetry(function () use ($rag, $chunk, $bar): void {
                    $bar->setMessage('working');
                    $rag->addDocuments($chunk, self::BATCH_SIZE);
                    $bar->advance(count($chunk));
                }, $bar);
            }
        } catch (Throwable $exception) {
            $bar->finish();
            $this->newLine(2);
            $this->error('Failed to build vector store: '.$exception->getMessage());
            $this->line('Run the same command again (without --fresh) to resume.');

            return self::FAILURE;
        }

        $bar->finish();
        $this->newLine(2);
        $this->info('Vector store built successfully.');
        $this->line("Store file: {$storePath}");

        return self::SUCCESS;
    }

    /**
     * @param  Document[]  $documents
     * @return array{0: Document[], 1: int, 2: array<string, array{indexed: int, expected: int}>}
     */
    private function resolvePendingDocuments(
        array $documents,
        string $storePath,
        bool $fresh,
        VetDocsRag $rag,
    ): array {
        $bySource = [];

        foreach ($documents as $document) {
            $bySource[$document->sourceName][] = $document;
        }

        ksort($bySource);

        if ($fresh || ! file_exists($storePath)) {
            $pending = [];

            foreach ($bySource as $chunks) {
                array_push($pending, ...$chunks);
            }

            return [$pending, 0, []];
        }

        $indexedCounts = $this->countIndexedChunksBySource($storePath);
        $vectorStore = $rag->resolveVectorStore();
        $pending = [];
        $skippedChunks = 0;
        $partialSources = [];

        foreach ($bySource as $sourceName => $chunks) {
            $expected = count($chunks);
            $indexed = $indexedCounts[$sourceName] ?? 0;

            if ($indexed >= $expected) {
                $skippedChunks += $expected;

                continue;
            }

            if ($indexed > 0) {
                $vectorStore->deleteBy('files', $sourceName);
                $partialSources[$sourceName] = [
                    'indexed' => $indexed,
                    'expected' => $expected,
                ];
            }

            array_push($pending, ...$chunks);
        }

        return [$pending, $skippedChunks, $partialSources];
    }

    /**
     * @return array<string, int>
     */
    private function countIndexedChunksBySource(string $storePath): array
    {
        $counts = [];
        $handle = fopen($storePath, 'r');

        if ($handle === false) {
            return $counts;
        }

        try {
            while (($line = fgets($handle)) !== false) {
                $line = trim($line);

                if ($line === '') {
                    continue;
                }

                $document = json_decode($line, true);

                if (! is_array($document) || ! isset($document['sourceName'])) {
                    continue;
                }

                $sourceName = (string) $document['sourceName'];
                $counts[$sourceName] = ($counts[$sourceName] ?? 0) + 1;
            }
        } finally {
            fclose($handle);
        }

        return $counts;
    }

    private function isRateLimitExceeded(Throwable $exception): bool
    {
        $message = $exception->getMessage();

        return str_contains($message, '429')
            || str_contains($message, 'RESOURCE_EXHAUSTED');
    }

    private function isTransientServiceError(Throwable $exception): bool
    {
        $message = $exception->getMessage();

        if (str_contains($message, 'Network error')) {
            return true;
        }

        $transientPatterns = [
            '502',
            '503',
            '504',
            'UNAVAILABLE',
            'BAD_GATEWAY',
            'GATEWAY_TIMEOUT',
            'SERVICE_UNAVAILABLE',
            'Error 502 (Server Error)',
            'Error 503',
            'Error 504',
            'temporary error and could not complete your request',
        ];

        foreach ($transientPatterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  callable(): void  $callback
     */
    private function runWithRetry(callable $callback, ProgressBar $bar): void
    {
        $transientAttempts = 0;

        while (true) {
            try {
                $callback();

                return;
            } catch (Throwable $exception) {
                if ($this->isRateLimitExceeded($exception)) {
                    $this->waitAndResume($bar, sprintf(
                        'Rate limit (429), waiting %d sec...',
                        self::RATE_LIMIT_WAIT_SECONDS,
                    ), self::RATE_LIMIT_WAIT_SECONDS);

                    continue;
                }

                if (! $this->isTransientServiceError($exception)) {
                    throw $exception;
                }

                $transientAttempts++;

                if ($transientAttempts > self::TRANSIENT_RETRY_MAX) {
                    throw $exception;
                }

                $this->waitAndResume($bar, sprintf(
                    'Service unavailable, retry %d/%d in %d sec...',
                    $transientAttempts,
                    self::TRANSIENT_RETRY_MAX,
                    self::TRANSIENT_RETRY_WAIT_SECONDS,
                ), self::TRANSIENT_RETRY_WAIT_SECONDS);
            }
        }
    }

    private function waitAndResume(ProgressBar $bar, string $message, int $seconds): void
    {
        $bar->clear();
        $this->newLine();
        $this->warn($message);
        $bar->setMessage('waiting');

        sleep($seconds);

        $this->line('Resuming indexing...');
        $bar->setMessage('working');
        $bar->display();
    }
}
