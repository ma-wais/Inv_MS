<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'created_by', 'number', 'entry_date', 'reference_type',
        'reference_id', 'reference_number', 'description', 'is_system',
    ];

    protected function casts(): array
    {
        return [
            'entry_date' => 'date',
            'is_system' => 'boolean',
        ];
    }

    public function lines()
    {
        return $this->hasMany(JournalLine::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reference()
    {
        return $this->morphTo();
    }
}
