<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    /**
     * Register a new user.
     *
     * POST /api/auth/register
     * → 201 { success: true, data: { user: {...}, token: "..." }, message: "..." }
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $result = $this->authService->register($validated);

        return response()->json([
            'success' => true,
            'data'    => [
                'user'  => $result['user'],
                'token' => $result['token'],
            ],
            'message' => 'Registrasi berhasil.',
        ], 201);
    }

    /**
     * Authenticate an existing user.
     *
     * POST /api/auth/login
     * → 200 { success: true, data: { user: {...}, token: "..." }, message: "..." }
     * → 401 { success: false, message: "..." } on invalid credentials
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        try {
            $result = $this->authService->login($validated);
        } catch (ValidationException) {
            return response()->json([
                'success' => false,
                'data'    => [],
                'message' => 'Email atau password salah.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'user'  => $result['user'],
                'token' => $result['token'],
            ],
            'message' => 'Login berhasil.',
        ]);
    }

    /**
     * Revoke the current user's access token.
     *
     * POST /api/auth/logout (requires auth:sanctum)
     * → 200 { success: true, data: [], message: "..." }
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'data'    => [],
            'message' => 'Berhasil logout.',
        ]);
    }

    /**
     * Return the currently authenticated user.
     *
     * GET /api/auth/me (requires auth:sanctum)
     * → 200 { success: true, data: { user: {...} }, message: "..." }
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'user' => $request->user(),
            ],
            'message' => 'Data user berhasil diambil.',
        ]);
    }
}
