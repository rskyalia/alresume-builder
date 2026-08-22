<?php

namespace App\Policies;

use App\Models\Resume;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ResumePolicy
{
    /**
     * Determine whether the user can view the resume.
     *
     * Requirement: 2.2
     */
    public function view(User $user, Resume $resume): bool
    {
        return $user->id === $resume->user_id;
    }

    /**
     * Determine whether the user can update the resume.
     *
     * Requirement: 2.3
     */
    public function update(User $user, Resume $resume): bool
    {
        return $user->id === $resume->user_id;
    }

    /**
     * Determine whether the user can delete the resume.
     *
     * Requirement: 2.4
     */
    public function delete(User $user, Resume $resume): bool
    {
        return $user->id === $resume->user_id;
    }

    /**
     * Determine whether the user can manage a section (education, experience,
     * skill, project, certificate) of a resume.
     *
     * The section must belong to the given resume to prevent IDOR when a
     * client passes a section id from another user's resume.
     */
    public function manageSection(User $user, Resume $resume, Model $section): bool
    {
        return $user->id === $resume->user_id
            && $section->getAttribute('resume_id') === $resume->id;
    }
}
