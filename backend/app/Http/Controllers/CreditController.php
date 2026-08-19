<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Services\CreditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreditController extends Controller
{
    public function __construct(private readonly CreditService $creditService) {}

    /**
     * Return the authenticated user's credit and subscription status.
     *
     * GET /api/credits (requires auth:sanctum)
     * → 200 { success: true, data: { plan, resume_credits, active_subscription }, message: "..." }
     *
     * Requirement: 10.4
     */
    public function status(Request $request): JsonResponse
    {
        $status = $this->creditService->getStatus($request->user());

        return response()->json([
            'success' => true,
            'data'    => $status,
            'message' => 'Status kredit berhasil diambil.',
        ]);
    }

    /**
     * Create a new subscription for the authenticated user and activate it.
     *
     * POST /api/subscriptions (requires auth:sanctum)
     * Body: plan_name, price, payment_ref (nullable), started_at, expires_at
     * → 201 { success: true, data: { subscription: {...} }, message: "..." }
     *
     * Requirement: 10.8
     */
    public function createSubscription(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_name'  => ['required', 'string'],
            'price'      => ['required', 'numeric', 'min:0'],
            'payment_ref' => ['nullable', 'string'],
            'started_at' => ['required', 'date'],
            'expires_at' => ['required', 'date', 'after:started_at'],
        ]);

        $subscription = Subscription::create([
            'user_id'    => $request->user()->id,
            'plan_name'  => $validated['plan_name'],
            'price'      => $validated['price'],
            'payment_ref' => $validated['payment_ref'] ?? null,
            'started_at' => $validated['started_at'],
            'expires_at' => $validated['expires_at'],
            'status'     => 'pending',
        ]);

        $this->creditService->activateSubscription($subscription);

        return response()->json([
            'success' => true,
            'data'    => [
                'subscription' => $subscription->fresh(),
            ],
            'message' => 'Langganan berhasil diaktifkan.',
        ], 201);
    }
}
