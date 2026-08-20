<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    private const ADMIN_EMAIL = 'dev@alresume.internal';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->email !== self::ADMIN_EMAIL) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak.',
                'errors'  => [],
            ], 403);
        }

        return $next($request);
    }
}
