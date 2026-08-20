<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Resume;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    public function index(Request $request, Resume $resume): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        return response()->json([
            'success' => true,
            'data'    => ['certificates' => $resume->certificates],
            'message' => 'Data sertifikat berhasil diambil.',
        ]);
    }

    public function store(Request $request, Resume $resume): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $validated = $request->validate([
            'certificate_type' => ['nullable', 'string', 'in:keahlian,prestasi,kegiatan'],
            'name'             => ['required', 'string', 'max:255'],
            'issuer'           => ['nullable', 'string', 'max:255'],
            'issue_date'       => ['nullable', 'date'],
            'credential_url'   => ['nullable', 'string', 'max:500'],
        ]);

        $certificate = Certificate::create([
            ...$validated,
            'resume_id' => $resume->id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => ['certificate' => $certificate],
            'message' => 'Sertifikat berhasil ditambahkan.',
        ], 201);
    }

    public function update(Request $request, Resume $resume, Certificate $certificate): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $validated = $request->validate([
            'certificate_type' => ['nullable', 'string', 'in:keahlian,prestasi,kegiatan'],
            'name'             => ['required', 'string', 'max:255'],
            'issuer'           => ['nullable', 'string', 'max:255'],
            'issue_date'       => ['nullable', 'date'],
            'credential_url'   => ['nullable', 'string', 'max:500'],
        ]);

        $certificate->update($validated);

        return response()->json([
            'success' => true,
            'data'    => ['certificate' => $certificate->fresh()],
            'message' => 'Sertifikat berhasil diperbarui.',
        ]);
    }

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
