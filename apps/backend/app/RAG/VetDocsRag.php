<?php

namespace App\RAG;

use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\Gemini\Gemini;
use NeuronAI\RAG\Embeddings\EmbeddingsProviderInterface;
use NeuronAI\RAG\Embeddings\GeminiEmbeddingsProvider;
use NeuronAI\RAG\RAG;
use NeuronAI\RAG\VectorStore\FileVectorStore;
use NeuronAI\RAG\VectorStore\VectorStoreInterface;

class VetDocsRag extends RAG
{
    protected function provider(): AIProviderInterface
    {
        return new Gemini(
            key: (string) config('gemini.api_key'),
            model: (string) config('gemini.model'),
        );
    }

    protected function embeddings(): EmbeddingsProviderInterface
    {
        return new GeminiEmbeddingsProvider(
            key: (string) config('gemini.api_key'),
            model: (string) config('rag.embeddings.model'),
        );
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
