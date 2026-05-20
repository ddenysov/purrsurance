<?php

namespace App\Console\Commands;

use App\Agents\PolicyManagerAgent;
use Illuminate\Console\Command;
use NeuronAI\Chat\Messages\UserMessage;
use Throwable;

class PolicyManagerChatCommand extends Command
{
    protected $signature = 'policy-manager:chat';

    protected $description = 'Interactive chat with the Policy Manager agent (Gemini)';

    public function handle(): int
    {
        if (blank(config('gemini.api_key'))) {
            $this->error('GEMINI_API_KEY is not set in .env');

            return self::FAILURE;
        }

        $agent = new PolicyManagerAgent;

        $this->info('Policy Manager agent chat. Type "exit" to quit.');
        $this->line('Example: I want to know about my policy POL-2025-123456');
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
                $this->line('<comment>PolicyManager:</comment> '.$content);
                $this->newLine();
            } catch (Throwable $exception) {
                $this->error($exception->getMessage());
            }
        }

        $this->info('Bye!');

        return self::SUCCESS;
    }
}
