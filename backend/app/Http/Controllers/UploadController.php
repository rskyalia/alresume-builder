<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Resume;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    /**
     * Upload a profile photo for a resume.
     */
    public function uploadPhoto(Request $request, Resume $resume): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403);

        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        // Delete old file if exists
        if ($resume->photo_path) {
            Storage::disk('public')->delete($resume->photo_path);
        }

        $path = $request->file('photo')->store('photos', 'public');

        $resume->update(['photo_path' => $path]);

        return response()->json([
            'success' => true,
            'data' => [
                'photo_url' => Storage::disk('public')->url($path),
            ],
        ]);
    }

    /**
     * Delete the profile photo of a resume.
     */
    public function deletePhoto(Request $request, Resume $resume): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403);

        if ($resume->photo_path) {
            Storage::disk('public')->delete($resume->photo_path);
        }

        $resume->update(['photo_path' => null]);

        return response()->json(['success' => true]);
    }

    /**
     * Upload a PDF file for a certificate.
     */
    public function uploadCertificateFile(Request $request, Resume $resume, Certificate $certificate): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403);

        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        // Delete old file if exists
        if ($certificate->file_path) {
            Storage::disk('public')->delete($certificate->file_path);
        }

        $path = $request->file('file')->store('certificates', 'public');

        $certificate->update(['file_path' => $path]);

        return response()->json([
            'success' => true,
            'data' => [
                'file_url' => Storage::disk('public')->url($path),
            ],
        ]);
    }

    /**
     * Delete the PDF file of a certificate.
     */
    public function deleteCertificateFile(Request $request, Resume $resume, Certificate $certificate): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403);

        if ($certificate->file_path) {
            Storage::disk('public')->delete($certificate->file_path);
        }

        $certificate->update(['file_path' => null]);

        return response()->json(['success' => true]);
    }
}
