<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PdfTemplate extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_pro',
        'html_path',
        'thumbnail',
    ];

    protected function casts(): array
    {
        return [
            'is_pro' => 'boolean',
        ];
    }

    public function scopeForUser(Builder $query, User $user): Builder
    {
        if ($user->isPro()) {
            return $query;
        }

        return $query->where('is_pro', false);
    }
}
