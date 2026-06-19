<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'name', 'code', 'contact_person', 'email', 'phone', 'address',
        'credit_limit', 'opening_balance', 'is_active', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'credit_limit' => 'decimal:4',
            'opening_balance' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    protected $appends = ['ledger_balance'];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function payments()
    {
        return $this->hasMany(CustomerPayment::class);
    }

    public function returns()
    {
        return $this->hasMany(SaleReturn::class);
    }

    public function ledgerBalance(): float
    {
        // For customers (Assets/Receivables):
        // Opening balance (debit) + Sales grand total (debit) - Payments (credit) - Returns (credit)
        return (float) $this->opening_balance
            + (float) $this->sales()->where('status', 'posted')->sum('grand_total')
            - (float) $this->returns()->where('status', 'posted')->sum('total')
            - (float) $this->payments()->sum('amount');
    }

    public function getLedgerBalanceAttribute(): float
    {
        return $this->ledgerBalance();
    }
}
