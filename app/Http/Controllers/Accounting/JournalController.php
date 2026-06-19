<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Services\Accounting\JournalEntryService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class JournalController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Accounting/Journals/Index', [
            'entries' => JournalEntry::query()
                ->with(['lines.account:id,code,name', 'creator:id,name'])
                ->latest('entry_date')
                ->paginate(20),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Accounting/Journals/Create', [
            'accounts' => Account::query()
                ->where('is_active', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name', 'normal_balance']),
        ]);
    }

    public function store(Request $request, JournalEntryService $service, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'entry_date' => ['required', 'date'],
            'description' => ['nullable', 'string', 'max:1000'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'lines' => ['required', 'array', 'min:2'],
            'lines.*.account_id' => ['required', 'integer', 'exists:accounts,id'],
            'lines.*.debit' => ['nullable', 'numeric', 'min:0'],
            'lines.*.credit' => ['nullable', 'numeric', 'min:0'],
            'lines.*.description' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $entry = $service->create([
                'entry_date' => $validated['entry_date'],
                'description' => $validated['description'] ?? null,
                'reference_number' => $validated['reference_number'] ?? null,
                'is_system' => false,
            ], $validated['lines']);

            $audit->record('journal.entry.created', $entry, null, $entry->toArray());

        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['lines' => $exception->getMessage()]);
        }

        return redirect()->route('journals.index')->with('status', 'Journal entry posted.');
    }
}
