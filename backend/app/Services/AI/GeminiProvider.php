<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;

class GeminiProvider
{
    /**
     * Send a prompt to the Gemini API and return the generated text.
     *
     * @throws AIProviderException when the API request fails or returns empty content.
     */
    public function generate(string $prompt): string
    {
        $apiKey = config('services.gemini.key');
        $model  = 'gemini-1.5-flash';

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
            'contents' => [
                ['parts' => [['text' => $prompt]]],
            ],
        ]);

        if ($response->failed()) {
            throw new AIProviderException('Gemini API request failed: ' . $response->body());
        }

        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');

        if (empty($text)) {
            throw new AIProviderException('Gemini returned empty response.');
        }

        return $text;
    }
}
