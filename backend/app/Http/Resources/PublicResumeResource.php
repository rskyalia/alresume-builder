<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource for publicly-accessible resume data.
 *
 * Requirements: 9.2
 */
class PublicResumeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'template'    => $this->template,
            'full_name'   => $this->full_name,
            'phone'       => $this->phone,
            'address'     => $this->address,
            'summary'     => $this->summary,
            'public_slug' => $this->public_slug,
            'education'   => $this->whenLoaded('education', fn () => $this->education->map(fn ($e) => [
                'id'             => $e->id,
                'institution'    => $e->institution,
                'degree'         => $e->degree,
                'field_of_study' => $e->field_of_study,
                'start_date'     => $e->start_date,
                'end_date'       => $e->end_date,
                'gpa'            => $e->gpa,
            ])),
            'experience' => $this->whenLoaded('experience', fn () => $this->experience->map(fn ($e) => [
                'id'          => $e->id,
                'company'     => $e->company,
                'position'    => $e->position,
                'start_date'  => $e->start_date,
                'end_date'    => $e->end_date,
                'is_current'  => $e->is_current,
                'description' => $e->description,
            ])),
            'skills' => $this->whenLoaded('skills', fn () => $this->skills->map(fn ($s) => [
                'id'    => $s->id,
                'name'  => $s->name,
                'level' => $s->level,
            ])),
            'projects' => $this->whenLoaded('projects', fn () => $this->projects->map(fn ($p) => [
                'id'          => $p->id,
                'name'        => $p->name,
                'description' => $p->description,
                'url'         => $p->url,
                'tech_stack'  => $p->tech_stack,
            ])),
            'certificates' => $this->whenLoaded('certificates', fn () => $this->certificates->map(fn ($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'issuer'         => $c->issuer,
                'issue_date'     => $c->issue_date,
                'credential_url' => $c->credential_url,
            ])),
            'updated_at' => $this->updated_at,
        ];
    }
}
