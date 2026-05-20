<?php

namespace App\Support\Neuron;

use NeuronAI\Observability\Events\Retrieved;
use NeuronAI\Observability\Events\Retrieving;
use NeuronAI\Observability\ObserverInterface;
use NeuronAI\RAG\Document;
use Symfony\Component\Console\Output\OutputInterface;

use function count;
use function mb_strlen;
use function mb_substr;

final class ConsoleRagDebugObserver implements ObserverInterface
{
    private const CONTENT_PREVIEW_LENGTH = 200;

    private bool $retrievalRan = false;

    /** @var Document[] */
    private array $documents = [];

    public function onEvent(string $event, object $source, mixed $data = null, ?string $branchId = null): void
    {
        if ($event === 'rag-retrieving' && $data instanceof Retrieving) {
            $this->reset();

            return;
        }

        if ($event === 'rag-retrieved' && $data instanceof Retrieved) {
            $this->retrievalRan = true;
            $this->documents = $data->documents;
        }
    }

    public function writeTo(OutputInterface $output): void
    {
        if (! $this->retrievalRan) {
            $output->writeln('<fg=yellow>[RAG]</> retrieval did not run');

            return;
        }

        $count = count($this->documents);

        if ($count === 0) {
            $output->writeln('<fg=yellow>[RAG]</> no documents retrieved (empty vector store or no matches)');

            return;
        }

        $output->writeln(sprintf('<fg=cyan>[RAG]</> retrieved %d chunk(s):', $count));

        foreach ($this->documents as $index => $document) {
            $output->writeln(sprintf(
                '  <fg=gray>%d.</> %s (%s) score=%.4f',
                $index + 1,
                $document->getSourceName(),
                $document->getSourceType(),
                $document->getScore(),
            ));
            $output->writeln('     '.$this->preview($document->getContent()));
        }
    }

    public function reset(): void
    {
        $this->retrievalRan = false;
        $this->documents = [];
    }

    private function preview(string $content): string
    {
        $content = preg_replace('/\s+/u', ' ', trim($content)) ?? '';

        if (mb_strlen($content) <= self::CONTENT_PREVIEW_LENGTH) {
            return $content;
        }

        return mb_substr($content, 0, self::CONTENT_PREVIEW_LENGTH).'…';
    }
}
