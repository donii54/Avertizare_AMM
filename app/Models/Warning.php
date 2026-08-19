<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warning extends Model
{
    protected $fillable = [
        'phenomenon',
        'emit_date',
        'interval_from',
        'interval_to',
        'codes',
        'districts',
        'map_image',
    ];

    protected $casts = [
        'codes'        => 'array',
        'districts'    => 'array',
        'emit_date'    => 'datetime',
        'interval_from' => 'datetime',
        'interval_to'  => 'datetime',
    ];

    /** Remove expired warnings (interval_to in the past). */
    public function scopeActive($query)
    {
        return $query->where('interval_to', '>', now());
    }

    /** Format dates as ISO strings for the frontend. */
    public function toFrontendArray(): array
    {
        return [
            'id'          => (string) $this->id,
            'phenomenon'  => $this->phenomenon,
            'emitDate'    => $this->emit_date->toIso8601String(),
            'intervalFrom' => $this->interval_from->toIso8601String(),
            'intervalTo'  => $this->interval_to->toIso8601String(),
            'interval'    => $this->interval_from->format('d.m.Y, \o\r\a H:i')
                           . ' – '
                           . $this->interval_to->format('d.m.Y, \o\r\a H:i'),
            'codes'       => $this->codes,
            'districts'   => $this->districts,
            'mapImage'    => $this->map_image,
            'createdAt'   => $this->created_at->toIso8601String(),
        ];
    }
}
