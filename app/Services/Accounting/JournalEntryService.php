<?php

namespace App\Services\Accounting;

use App\Models\JournalEntry;
use App\Services\DocumentNumberService;
use App\Support\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class JournalEntryService
{
    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly DocumentNumberService $documentNumbers,
    ) {}

    public function create(array $data, array $lines): JournalEntry
    {
        if ($lines === []) {
            throw new InvalidArgumentException('A journal entry must have at least one line.');
        }

        $debitSum = 0.0;
        $creditSum = 0.0;

        $normalizedLines = collect($lines)->map(function (array $line) use (&$debitSum, &$creditSum) {
            $debit = round((float) ($line['debit'] ?? 0.0), 4);
            $credit = round((float) ($line['credit'] ?? 0.0), 4);

            if ($debit < 0 || $credit < 0) {
                throw new InvalidArgumentException('Debits and credits cannot be negative.');
            }

            if ($debit > 0 && $credit > 0) {
                throw new InvalidArgumentException('A single line cannot have both a debit and a credit.');
            }

            $debitSum += $debit;
            $creditSum += $credit;

            return [
                'account_id' => $line['account_id'],
                'debit' => $debit,
                'credit' => $credit,
                'description' => $line['description'] ?? null,
            ];
        });

        // Ensure debits equal credits within a margin of 0.0001
        if (abs($debitSum - $creditSum) > 0.0001) {
            throw new InvalidArgumentException("Unbalanced journal entry. Debits: {$debitSum}, Credits: {$creditSum}");
        }

        if ($debitSum === 0.0) {
            throw new InvalidArgumentException('Journal entry amount must be greater than zero.');
        }

        return DB::transaction(function () use ($data, $normalizedLines): JournalEntry {
            $entry = JournalEntry::create([
                'tenant_id' => $this->tenantContext->id(),
                'created_by' => auth()->id(),
                'number' => $this->documentNumbers->next(JournalEntry::class, 'JRN'),
                'entry_date' => $data['entry_date'],
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'reference_number' => $data['reference_number'] ?? null,
                'description' => $data['description'] ?? null,
                'is_system' => $data['is_system'] ?? false,
            ]);

            foreach ($normalizedLines as $line) {
                $entry->lines()->create([
                    'tenant_id' => $this->tenantContext->id(),
                    'account_id' => $line['account_id'],
                    'debit' => $line['debit'],
                    'credit' => $line['credit'],
                    'description' => $line['description'],
                ]);
            }

            return $entry;
        });
    }
}
