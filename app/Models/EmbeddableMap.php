<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class EmbeddableMap extends Model
{
    protected $fillable = [
        'token',
        'title',
        'districts',
    ];

    protected $casts = [
        'districts' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $map) {
            if (! $map->token) {
                $map->token = strtolower((string) Str::ulid());
            }
        });
    }

    public function toFrontendArray(): array
    {
        return [
            'id' => (string) $this->id,
            'token' => $this->token,
            'title' => $this->title,
            'districts' => $this->districts ?? [],
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
            'embedPath' => '/embed/'.$this->token,
        ];
    }
}
