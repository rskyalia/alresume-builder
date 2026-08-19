<?php

namespace App\Services;

use App\Models\Resume;
use Illuminate\Support\Str;

class ShareService
{
    /**
     * Toggle the public visibility of a resume.
     *
     * Requirements: 9.1, 9.2, 9.4, 9.5, 9.6
     *
     * @return array{is_public: bool, public_slug: string|null, public_url: string|null}
     */
    public function toggleVisibility(Resume $resume, bool $isPublic): array
    {
        if ($isPublic && ! $resume->public_slug) {
            // Generate a unique 8-character alphanumeric slug (Req 9.6)
            do {
                $slug = Str::random(8);
            } while (Resume::where('public_slug', $slug)->exists());

            $resume->update(['is_public' => true, 'public_slug' => $slug]);
        } else {
            // Toggle visibility while preserving existing slug (Req 9.5)
            $resume->update(['is_public' => $isPublic]);
        }

        // Refresh to get updated values
        $resume->refresh();

        return [
            'is_public'   => $resume->is_public,
            'public_slug' => $resume->public_slug,
            'public_url'  => $resume->is_public
                ? config('app.frontend_url') . '/r/' . $resume->public_slug
                : null,
        ];
    }
}
