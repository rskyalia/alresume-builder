<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Resume;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * List all projects for a resume.
     *
     * GET /api/resumes/{resume}/projects
     * → 200 { success: true, data: { projects: [...] } }
     * → 403 if not the owner
     *
     * Requirement: 3.4, 3.5
     */
    public function index(Request $request, Resume $resume): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $projects = $resume->projects;

        return response()->json([
            'success' => true,
            'data'    => [
                'projects' => $projects,
            ],
            'message' => 'Data proyek berhasil diambil.',
        ]);
    }

    /**
     * Create a new project entry.
     *
     * POST /api/resumes/{resume}/projects
     * Body: name (required), description/url/tech_stack (nullable)
     * → 201 { success: true, data: { project: {...} } }
     * → 422 if validation fails
     * → 403 if not the owner
     *
     * Requirement: 3.5
     */
    public function store(Request $request, Resume $resume): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'url'         => ['nullable', 'string', 'max:500'],
            'tech_stack'  => ['nullable', 'string'],
        ]);

        $project = Project::create([
            ...$validated,
            'resume_id' => $resume->id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'project' => $project,
            ],
            'message' => 'Proyek berhasil ditambahkan.',
        ], 201);
    }

    /**
     * Update a project entry.
     *
     * PUT/PATCH /api/resumes/{resume}/projects/{project}
     * → 200 { success: true, data: { project: {...} } }
     * → 422 if validation fails
     * → 403 if not the owner
     *
     * Requirement: 3.6
     */
    public function update(Request $request, Resume $resume, Project $project): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'url'         => ['nullable', 'string', 'max:500'],
            'tech_stack'  => ['nullable', 'string'],
        ]);

        $project->update($validated);

        return response()->json([
            'success' => true,
            'data'    => [
                'project' => $project->fresh(),
            ],
            'message' => 'Proyek berhasil diperbarui.',
        ]);
    }

    /**
     * Delete a project entry.
     *
     * DELETE /api/resumes/{resume}/projects/{project}
     * → 200 { success: true }
     * → 403 if not the owner
     *
     * Requirement: 3.7
     */
    public function destroy(Request $request, Resume $resume, Project $project): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $project->delete();

        return response()->json([
            'success' => true,
            'data'    => [],
            'message' => 'Proyek berhasil dihapus.',
        ]);
    }
}
