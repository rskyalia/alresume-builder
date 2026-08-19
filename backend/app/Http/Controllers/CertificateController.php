<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Resume;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    /**
     * List all certificates for a resume.
     *
     * GET /api/resumes/{resume}/certificates
     * → 200 { success: true, data: { certificates: [...] } }
     * → 403 if not the owner
     *
     * Requirement: 3.4, 3.5
     */
    public function index(Request $request, Resume $resume): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $certificates = $resume->certificates;

        return response()->json([
            'success' => true,
            'data'    => [
                'certificates' => $certificates,
            ],
            'message' => 'Data sertifikat berhasil diambil.',
        ]);
    }

    /**
     * Create a new certificate entry.
     *
     * POST /api/resumes/{resume}/certificates
     * Body: name (required), issuer/issue_date/credential_url (nullable)
     * → 201 { success: true, data: { certificate: {...} } }
     * → 422 if validation fails
     * → 403 if not the owner
     *
     * Requirement: 3.5
     */
    public function store(Request $request, Resume $resume): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'issuer'         => ['nullable', 'string', 'max:255'],
            'issue_date'     => ['nullable', 'date'],
            'credential_url' => ['nullable', 'string', 'max:500'],
        ]);

        $certificate = Certificate::create([
            ...$validated,
            'resume_id' => $resume->id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'certificate' => $certificate,
            ],
            'message' => 'Sertifikat berhasil ditambahkan.',
        ], 201);
    }

    /**
     * Update a certificate entry.
     *
     * PUT/PATCH /api/resumes/{resume}/certificates/{certificate}
     * → 200 { success: true, data: { certificate: {...} } }
     * → 422 if validation fails
     * → 403 if not the owner
     *
     * Requirement: 3.6
     */
    public function update(Request $request, Resume $resume, Certificate $certificate): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'issuer'         => ['nullable', 'string', 'max:255'],
            'issue_date'     => ['nullable', 'date'],
            'credential_url' => ['nullable', 'string', 'max:500'],
        ]);

        $certificate->update($validated);

        return response()->json([
            'success' => true,
            'data'    => [
                'certificate' => $certificate->fresh(),
            ],
            'message' => 'Sertifikat berhasil diperbarui.',
        ]);
    }

    /**
     * Delete a certificate entry.
     *
     * DELETE /api/resumes/{resume}/certificates/{certificate}
     * → 200 { success: true }
     * → 403 if not the owner
     *
     * Requirement: 3.7
     */
    public function destroy(Request $request, Resume $resume, Certificate $certificate): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $certificate->delete();

        return response()->json([
            'success' => true,
            'data'    => [],
            'message' => 'Sertifikat berhasil dihapus.',
        ]);
    }
}
