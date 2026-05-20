<?php

namespace App\Console\Commands;

use App\Services\AgentRouter\AgentRouter;
use Illuminate\Console\Command;
use Throwable;

class AgentRouterChatCommand extends Command
{
    protected $signature = 'agent-router:chat {--policy= : Optional policy ID for context}';

    protected $description = 'Interactive chat via the agent router (classify + route)';

    public function handle(AgentRouter $router): int
    {
        if (blank(config('gemini.api_key'))) {
            $this->error('GEMINI_API_KEY is not set in .env');

            return self::FAILURE;
        }

        $policyId = $this->option('policy');
        $chatHistory = [];

        $this->info('Agent Router chat. Type "exit" to quit.');
        $this->line('Examples:');
        $this->line('  - My policy id is POL-2025-123456');
        $this->line('  - My cat is lethargic and refuses to eat');
        $this->line('  - I need to book a vet appointment');
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
                $result = $router->route(
                    message: $input,
                    chatHistory: $chatHistory,
                    policyId: is_string($policyId) ? $policyId : null,
                );

                $chatHistory[] = ['content' => $input, 'sender' => 'user'];
                $chatHistory[] = ['content' => $result->response, 'sender' => 'assistant'];

                $this->newLine();
                $this->line("<comment>[{$result->classification}]</comment> {$result->response}");
                $this->newLine();
            } catch (Throwable $exception) {
                $this->error($exception->getMessage());
            }
        }

        $this->info('Bye!');

        return self::SUCCESS;
    }
}
