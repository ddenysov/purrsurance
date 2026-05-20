<?php

namespace App\Console\Commands;

use App\Agents\VetDocAgent;
use Illuminate\Console\Command;
use NeuronAI\Chat\Messages\UserMessage;
use Throwable;

class VetDocAgentChatCommand extends Command
{
    protected $signature = 'vet-doc:chat';

    protected $description = 'Interactive chat with the Vet Doc agent (Gemini + veterinary textbook RAG)';

    public function handle(): int
    {
        if (blank(config('gemini.api_key'))) {
            $this->error('GEMINI_API_KEY is not set in .env');

            return self::FAILURE;
        }

        $agent = new VetDocAgent;

        if (! $agent->hasVectorStore()) {
            $this->warn('Vector store is missing or empty. Run: php artisan rag:build-vet-docs');
            $this->newLine();
        } else {
            $this->line('Vector store: '.$agent->storeFilePath());
        }

        $this->info('Vet Doc agent chat. Type "exit" to quit.');
        $this->line('Example: My 3-year-old cat has been lethargic and refuses to eat for two days.');
        $this->newLine();

        while (true) {
            $input = $this->ask('You');

            if ($input === null) {
                break;
            }

            $input = trim($input);

            if ($input === '' || in_array(strtolower($input), ['exit', 'quit', 'q'], true)) {
                break;
            }

            try {
                $response = $agent->chat(new UserMessage($input))->getMessage();
                $content = $response->getContent() ?? '';

                $this->newLine();
                $this->line('<comment>VetDoc:</comment> '.$content);
                $this->newLine();
            } catch (Throwable $exception) {
                $this->error($exception->getMessage());
            }
        }

        $this->info('Bye!');

        return self::SUCCESS;
    }
}
