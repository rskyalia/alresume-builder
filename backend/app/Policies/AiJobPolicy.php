<?php

namespace App\Policies;

use App\Models\AiJob;
use App\Models\User;

class AiJobPolicy
{
    /**
     * Determine whether the user can view an AI job (polling endpoint).
     */
    public function view(User $user, AiJob $aiJob): bool
    {
        return $user->id === $aiJob->user_id;
    }
}
