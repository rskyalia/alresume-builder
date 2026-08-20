<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin-only endpoints.
 * Protected by the `admin` middleware — only dev@alresume.internal can access.
 */
class AdminController extends Controller
{
    /**
     * List all users with their plan and credits.
     * GET /api/admin/users
     */
    public function users(): JsonResponse
    {
        $users = User::select('id', 'name', 'email', 'plan', 'resume_credits', 'created_at')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $users,
        ]);
    }

    /**
     * Top-up resume credits for a user.
     * POST /api/admin/users/{user}/top-up
     * Body: { credits: int, plan?: 'free'|'pro' }
     */
    public function topUp(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'credits' => ['required', 'integer', 'min:1', 'max:100000'],
            'plan'    => ['nullable', 'in:free,pro'],
        ]);

        $user->increment('resume_credits', $validated['credits']);

        if (isset($validated['plan'])) {
            $user->update(['plan' => $validated['plan']]);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'id'             => $user->id,
                'name'           => $user->name,
                'email'          => $user->email,
                'plan'           => $user->fresh()->plan,
                'resume_credits' => $user->fresh()->resume_credits,
            ],
            'message' => "Berhasil menambahkan {$validated['credits']} kredit ke {$user->email}.",
        ]);
    }

    /**
     * Set plan for a user (upgrade/downgrade).
     * PATCH /api/admin/users/{user}/plan
     * Body: { plan: 'free'|'pro' }
     */
    public function setPlan(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'plan' => ['required', 'in:free,pro'],
        ]);

        $user->update(['plan' => $validated['plan']]);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'    => $user->id,
                'email' => $user->email,
                'plan'  => $user->plan,
            ],
            'message' => "Plan {$user->email} diubah ke {$validated['plan']}.",
        ]);
    }
}
