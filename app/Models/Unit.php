<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = ['tenant_id', 'name', 'symbol', 'allows_decimal', 'is_active'];

    protected function casts(): array
    {
        return [
            'allows_decimal' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
