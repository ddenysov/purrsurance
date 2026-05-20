<?php

return [

    'sources_path' => env('RAG_SOURCES_PATH', base_path('rag')),

    'vector_store' => [
        'directory' => storage_path('app/rag'),
        'name' => env('RAG_VECTOR_STORE_NAME', 'vet-docs'),
    ],

    'chunk' => [
        'max_words' => (int) env('RAG_CHUNK_MAX_WORDS', 400),
        'overlap_words' => (int) env('RAG_CHUNK_OVERLAP_WORDS', 50),
    ],

    'embeddings' => [
        'model' => env('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001'),
    ],

];
