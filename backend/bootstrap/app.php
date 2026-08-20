<?php

use App\Exceptions\ForbiddenException;
use App\Exceptions\InsufficientCreditsException;
use App\Exceptions\RateLimitExceededException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (InsufficientCreditsException $e): JsonResponse {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors'  => [],
            ], 403);
        });

        $exceptions->render(function (RateLimitExceededException $e): JsonResponse {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors'  => [],
            ], 429);
        });

        $exceptions->render(function (ForbiddenException $e): JsonResponse {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors'  => [],
            ], 403);
        });

        $exceptions->render(function (ModelNotFoundException $e): JsonResponse {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan.',
                'errors'  => [],
            ], 404);
        });

        $exceptions->render(function (ValidationException $e): JsonResponse {
            return response()->json([
                'success' => false,
                'message' => 'Data yang diberikan tidak valid.',
                'errors'  => $e->errors(),
            ], 422);
        });

        // Always return JSON 401 — never redirect to a "login" route
        $exceptions->render(function (AuthenticationException $e, Request $request): JsonResponse {
            return response()->json([
                'success' => false,
                'message' => 'Tidak terautentikasi.',
                'errors'  => [],
            ], 401);
        });
    })->create();
