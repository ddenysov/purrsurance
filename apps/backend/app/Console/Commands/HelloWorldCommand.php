<?php

namespace App\Console\Commands;

use App\Agents\ConsoleChatAgent;
use Illuminate\Console\Command;
use NeuronAI\Chat\Messages\UserMessage;
use Throwable;

class HelloWorldCommand extends Command
{
    protected $signature = 'hello:world';

    protected $description = 'Interactive chat with a Gemini agent';

    public function handle(): int
    {
        if (blank(config('gemini.api_key'))) {
            $this->error('GEMINI_API_KEY is not set in .env');

            return self::FAILURE;
        }

        $agent = new ConsoleChatAgent;

        $this->info('Interactive agent chat (Gemini). Type "exit" to quit.');
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
                $this->line('<comment>Agent:</comment> '.$content);
                $this->newLine();
            } catch (Throwable $exception) {
                $this->error($exception->getMessage());
            }
        }

        $this->info('Bye!');

        return self::SUCCESS;
    }
}
