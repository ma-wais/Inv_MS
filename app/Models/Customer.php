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
        'credit_limit', 'opening_balance', 'is_active', 'notes', 'cnic',
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
        if (array_key_exists('ledger_sales_total', $this->attributes)) {
            return (float) $this->opening_balance + (float) $this->ledger_sales_total
                - (float) $this->ledger_returns_total - (float) $this->ledger_payments_total;
        }

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

    public function scopeWithLedgerTotals($query)
    {
        return $query->withSum(['sales as ledger_sales_total' => fn ($query) => $query->where('status', 'posted')], 'grand_total')
            ->withSum(['returns as ledger_returns_total' => fn ($query) => $query->where('status', 'posted')], 'total')
            ->withSum('payments as ledger_payments_total', 'amount');
    }
}
