<?php

namespace App\Services;

use App\Exceptions\RateLimitExceededException;
use App\Models\DailyAiUsage;
use App\Models\User;
use Illuminate\Support\Carbon;

class RateLimitService
{
    /**
     * Daily limits per AI feature type for free users.
     * Requirements: 4.7, 5.7, 6.4, 7.5
     */
    const LIMITS = [
        'summary'              => 10,
        'experience_rewrite'   => 10,
        'ats_score'            => 3,
        'cover_letter'         => 3,
    ];

    /**
     * Check if the user is within the daily usage limit for the given type.
     *
     * - Pro users: always allowed, returns immediately.
     * - Free users: fetch or create a DailyAiUsage record for today (UTC).
     *   If count >= limit, throw RateLimitExceededException.
     *   Otherwise, increment the count and allow the request.
     *
     * Requirements: 4.7, 5.7, 6.4, 7.5
     */
    public function checkOrFail(User $user, string $type): void
    {
        if ($user->isPro()) {
            return; // Pro users have no daily limits
        }

        $limit = self::LIMITS[$type] ?? 0;
        $today = Carbon::now('UTC')->toDateString();

        $usage = DailyAiUsage::firstOrCreate(
            [
                'user_id'    => $user->id,
                'type'       => $type,
                'usage_date' => $today,
            ],
            ['count' => 0]
        );

        if ($usage->count >= $limit) {
            throw new RateLimitExceededException(
                "Batas harian untuk fitur ini ({$limit}x) telah tercapai."
            );
        }

        $usage->increment('count');
    }
}
