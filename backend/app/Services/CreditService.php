<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\User;

class CreditService
{
    /**
     * Get the credit/subscription status for a user.
     *
     * Returns the user's current plan, remaining resume credits,
     * and their active subscription details if one exists.
     *
     * Requirement: 10.2, 10.3
     */
    public function getStatus(User $user): array
    {
        $sub = $user->subscriptions()
            ->where('status', 'active')
            ->orderBy('expires_at', 'desc')
            ->first();

        return [
            'plan'                => $user->plan,
            'resume_credits'      => $user->resume_credits,
            'active_subscription' => $sub ? [
                'plan_name'  => $sub->plan_name,
                'expires_at' => $sub->expires_at,
            ] : null,
        ];
    }

    /**
     * Activate a subscription and upgrade the associated user to pro plan.
     *
     * Requirement: 10.4, 10.5
     */
    public function activateSubscription(Subscription $subscription): void
    {
        $subscription->update(['status' => 'active']);
        $subscription->user->update(['plan' => 'pro']);
    }

    /**
     * Expire all active subscriptions whose expiry date has passed,
     * and downgrade the associated users to the free plan.
     *
     * Note: resume_credits are intentionally NOT reset on expiry (requirement 10.6).
     *
     * Returns the number of subscriptions that were expired.
     *
     * Requirement: 10.6, 10.8
     */
    public function expireSubscriptions(): int
    {
        $expired = Subscription::where('status', 'active')
            ->where('expires_at', '<', now())
            ->with('user')
            ->get();

        foreach ($expired as $sub) {
            $sub->update(['status' => 'expired']);
            $sub->user->update(['plan' => 'free']);
            // Do NOT reset resume_credits (requirement 10.6)
        }

        return $expired->count();
    }
}
