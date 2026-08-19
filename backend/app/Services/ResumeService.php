<?php

namespace App\Services;

use App\Exceptions\InsufficientCreditsException;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class ResumeService
{
    /**
     * Create a new resume for the given user.
     *
     * Checks available credits before creating. Free users have their
     * resume_credits decremented after a successful creation.
     * Pro users are never charged credits.
     *
     * Throws InsufficientCreditsException if the user has no credits remaining.
     *
     * Requirement: 3.1, 3.2, 3.3
     */
    public function create(User $user, array $data): Resume
    {
        if (! $user->hasResumeCredits()) {
            throw new InsufficientCreditsException();
        }

        $resume = Resume::create([
            ...$data,
            'user_id' => $user->id,
        ]);

        $user->decrementResumeCredit();

        return $resume;
    }

    /**
     * Delete the given resume (cascade handled by DB foreign keys).
     *
     * Requirement: 2.4, 2.5
     */
    public function delete(Resume $resume): void
    {
        $resume->delete();
    }

    /**
     * Validate that endDate is not before startDate.
     *
     * Throws a ValidationException with a localized message when the date
     * range is invalid.
     *
     * Requirement: 3.11
     *
     * @throws ValidationException
     */
    public function validateDates(string $startDate, ?string $endDate): void
    {
        if ($endDate !== null && $endDate < $startDate) {
            throw ValidationException::withMessages([
                'end_date' => ['Tanggal selesai tidak boleh lebih awal dari tanggal mulai.'],
            ]);
        }
    }
}
