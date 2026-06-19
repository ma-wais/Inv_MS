<?php

namespace App\Services\Accounting;

use App\Models\Account;
use App\Models\CustomerPayment;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\SupplierPayment;
use InvalidArgumentException;

class AutomaticPostingService
{
    public function __construct(
        private readonly JournalEntryService $journalEntries,
    ) {}

    public function postPurchase(Purchase $purchase): void
    {
        $inventoryAcc = $this->getAccount('1400');
        $apAcc = $this->getAccount('2100');

        $amount = (float) $purchase->grand_total;

        if ($amount <= 0) return;

        $this->journalEntries->create([
            'entry_date' => $purchase->purchase_date->toDateString(),
            'reference_type' => Purchase::class,
            'reference_id' => $purchase->id,
            'reference_number' => $purchase->number,
            'description' => "System posting for purchase: {$purchase->number}",
            'is_system' => true,
        ], [
            [
                'account_id' => $inventoryAcc->id,
                'debit' => $amount,
                'credit' => 0.0,
                'description' => 'Inventory addition',
            ],
            [
                'account_id' => $apAcc->id,
                'debit' => 0.0,
                'credit' => $amount,
                'description' => 'Accounts Payable credit',
            ],
        ]);
    }

    public function postPurchasePayment(SupplierPayment $payment): void
    {
        $apAcc = $this->getAccount('2100');
        $cashAcc = $this->resolvePaymentAccount($payment->account_id, $payment->method);

        $amount = (float) $payment->amount;

        if ($amount <= 0) return;

        $this->journalEntries->create([
            'entry_date' => $payment->payment_date->toDateString(),
            'reference_type' => SupplierPayment::class,
            'reference_id' => $payment->id,
            'reference_number' => $payment->number,
            'description' => "System posting for supplier payment: {$payment->number}",
            'is_system' => true,
        ], [
            [
                'account_id' => $apAcc->id,
                'debit' => $amount,
                'credit' => 0.0,
                'description' => 'Accounts Payable debit',
            ],
            [
                'account_id' => $cashAcc->id,
                'debit' => 0.0,
                'credit' => $amount,
                'description' => 'Payment from cash/bank',
            ],
        ]);
    }

    public function postPurchaseReturn(PurchaseReturn $return): void
    {
        $apAcc = $this->getAccount('2100');
        $inventoryAcc = $this->getAccount('1400');

        $amount = (float) $return->total;

        if ($amount <= 0) return;

        $this->journalEntries->create([
            'entry_date' => $return->return_date->toDateString(),
            'reference_type' => PurchaseReturn::class,
            'reference_id' => $return->id,
            'reference_number' => $return->number,
            'description' => "System posting for purchase return: {$return->number}",
            'is_system' => true,
        ], [
            [
                'account_id' => $apAcc->id,
                'debit' => $amount,
                'credit' => 0.0,
                'description' => 'Accounts Payable debit',
            ],
            [
                'account_id' => $inventoryAcc->id,
                'debit' => 0.0,
                'credit' => $amount,
                'description' => 'Inventory reduction',
            ],
        ]);
    }

    public function postSale(Sale $sale): void
    {
        $arAcc = $this->getAccount('1300');
        $revenueAcc = $this->getAccount('4100');

        $saleAmount = (float) $sale->grand_total;

        if ($saleAmount <= 0) return;

        // Post revenue entry
        $this->journalEntries->create([
            'entry_date' => $sale->sale_date->toDateString(),
            'reference_type' => Sale::class,
            'reference_id' => $sale->id,
            'reference_number' => $sale->number,
            'description' => "System posting for sale revenue: {$sale->number}",
            'is_system' => true,
        ], [
            [
                'account_id' => $arAcc->id,
                'debit' => $saleAmount,
                'credit' => 0.0,
                'description' => 'Accounts Receivable debit',
            ],
            [
                'account_id' => $revenueAcc->id,
                'debit' => 0.0,
                'credit' => $saleAmount,
                'description' => 'Sales Revenue credit',
            ],
        ]);

        // Post COGS entry
        $sale->load('items.variant');
        $cogsAmount = 0.0;
        foreach ($sale->items as $item) {
            $cogsAmount += (float) $item->quantity * (float) $item->variant->purchase_price;
        }

        if ($cogsAmount <= 0) return;

        $cogsAcc = $this->getAccount('5100');
        $inventoryAcc = $this->getAccount('1400');

        $this->journalEntries->create([
            'entry_date' => $sale->sale_date->toDateString(),
            'reference_type' => Sale::class,
            'reference_id' => $sale->id,
            'reference_number' => $sale->number,
            'description' => "System posting for sale COGS: {$sale->number}",
            'is_system' => true,
        ], [
            [
                'account_id' => $cogsAcc->id,
                'debit' => $cogsAmount,
                'credit' => 0.0,
                'description' => 'Cost of Goods Sold debit',
            ],
            [
                'account_id' => $inventoryAcc->id,
                'debit' => 0.0,
                'credit' => $cogsAmount,
                'description' => 'Inventory credit',
            ],
        ]);
    }

    public function postSalePayment(CustomerPayment $payment): void
    {
        $arAcc = $this->getAccount('1300');
        $cashAcc = $this->resolvePaymentAccount($payment->account_id, $payment->method);

        $amount = (float) $payment->amount;

        if ($amount <= 0) return;

        $this->journalEntries->create([
            'entry_date' => $payment->payment_date->toDateString(),
            'reference_type' => CustomerPayment::class,
            'reference_id' => $payment->id,
            'reference_number' => $payment->number,
            'description' => "System posting for customer payment: {$payment->number}",
            'is_system' => true,
        ], [
            [
                'account_id' => $cashAcc->id,
                'debit' => $amount,
                'credit' => 0.0,
                'description' => 'Payment to cash/bank',
            ],
            [
                'account_id' => $arAcc->id,
                'debit' => 0.0,
                'credit' => $amount,
                'description' => 'Accounts Receivable credit',
            ],
        ]);
    }

    public function postSaleReturn(SaleReturn $return): void
    {
        $revenueAcc = $this->getAccount('4100');
        $arAcc = $this->getAccount('1300');

        $returnAmount = (float) $return->total;

        if ($returnAmount <= 0) return;

        $this->journalEntries->create([
            'entry_date' => $return->return_date->toDateString(),
            'reference_type' => SaleReturn::class,
            'reference_id' => $return->id,
            'reference_number' => $return->number,
            'description' => "System posting for sale return: {$return->number}",
            'is_system' => true,
        ], [
            [
                'account_id' => $revenueAcc->id,
                'debit' => $returnAmount,
                'credit' => 0.0,
                'description' => 'Sales Revenue debit (reversal)',
            ],
            [
                'account_id' => $arAcc->id,
                'debit' => 0.0,
                'credit' => $returnAmount,
                'description' => 'Accounts Receivable credit (reversal)',
            ],
        ]);

        // Post COGS reversal entry
        $return->load('items.variant');
        $cogsReversal = 0.0;
        foreach ($return->items as $item) {
            $cogsReversal += (float) $item->quantity * (float) $item->variant->purchase_price;
        }

        if ($cogsReversal <= 0) return;

        $inventoryAcc = $this->getAccount('1400');
        $cogsAcc = $this->getAccount('5100');

        $this->journalEntries->create([
            'entry_date' => $return->return_date->toDateString(),
            'reference_type' => SaleReturn::class,
            'reference_id' => $return->id,
            'reference_number' => $return->number,
            'description' => "System posting for sale return COGS: {$return->number}",
            'is_system' => true,
        ], [
            [
                'account_id' => $inventoryAcc->id,
                'debit' => $cogsReversal,
                'credit' => 0.0,
                'description' => 'Inventory debit (reversal)',
            ],
            [
                'account_id' => $cogsAcc->id,
                'debit' => 0.0,
                'credit' => $cogsReversal,
                'description' => 'Cost of Goods Sold credit (reversal)',
            ],
        ]);
    }

    private function getAccount(string $code): Account
    {
        return Account::query()->where('code', $code)->firstOrFail();
    }

    private function resolvePaymentAccount(?int $accountId, string $method): Account
    {
        if ($accountId) {
            return Account::query()->findOrFail($accountId);
        }

        if ($method === 'cash') {
            return $this->getAccount('1100'); // Cash on Hand
        }

        return $this->getAccount('1200'); // Bank Account
    }
}
