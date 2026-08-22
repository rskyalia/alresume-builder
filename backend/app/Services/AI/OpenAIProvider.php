<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;

class OpenAIProvider
{
    public function generate(string $prompt): string
    {
        $apiKey = config('services.openai.key');

        $response = Http::withOptions([
            // null/false → pakai CA bundle default sistem; string → path CA bundle kustom
            'verify' => config('services.ai.ca_bundle') ?: true,
        ])->withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type'  => 'application/json',
        ])->post('https://api.openai.com/v1/chat/completions', [
            'model'      => 'gpt-4o-mini',
            'messages'   => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => 1000,
        ]);

        if ($response->failed()) {
            throw new AIProviderException('OpenAI API request failed: ' . $response->body());
        }

        $text = data_get($response->json(), 'choices.0.message.content');

        if (empty($text)) {
            throw new AIProviderException('OpenAI returned empty response.');
        }

        return $text;
    }
}
