<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'name', 'code', 'contact_person', 'email', 'phone', 'address', 'tax_number',
        'opening_balance', 'is_active', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'opening_balance' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    protected $appends = ['ledger_balance'];

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    public function payments()
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public function returns()
    {
        return $this->hasMany(PurchaseReturn::class);
    }

    public function ledgerBalance(): float
    {
        return (float) $this->opening_balance
            + (float) $this->purchases()->where('status', Purchase::STATUS_POSTED)->sum('grand_total')
            + (float) $this->returns()->where('status', 'posted')->sum('total')
            - (float) $this->payments()->sum('amount');
    }

    public function getLedgerBalanceAttribute(): float
    {
        return $this->ledgerBalance();
    }
}
