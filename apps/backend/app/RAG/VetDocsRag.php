<?php

namespace App\RAG;

use App\Support\Neuron\GeminiFactory;
use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\RAG\Embeddings\EmbeddingsProviderInterface;
use NeuronAI\RAG\RAG;
use NeuronAI\RAG\VectorStore\FileVectorStore;
use NeuronAI\RAG\VectorStore\VectorStoreInterface;

class VetDocsRag extends RAG
{
    protected function provider(): AIProviderInterface
    {
        return GeminiFactory::provider();
    }

    protected function embeddings(): EmbeddingsProviderInterface
    {
        return GeminiFactory::embeddingsProvider((string) config('rag.embeddings.model'));
    }

    protected function vectorStore(): VectorStoreInterface
    {
        return new FileVectorStore(
            directory: (string) config('rag.vector_store.directory'),
            topK: (int) config('rag.retrieval.top_k'),
            name: (string) config('rag.vector_store.name'),
        );
    }

    public function storeFilePath(): string
    {
        $directory = (string) config('rag.vector_store.directory');
        $name = (string) config('rag.vector_store.name');

        return $directory.DIRECTORY_SEPARATOR.$name.'.store';
    }

    public function hasVectorStore(): bool
    {
        $path = $this->storeFilePath();

        return file_exists($path) && filesize($path) > 0;
    }
}
