<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class ReportPeriod
{
    public static function fromRequest(Request $request, string $timezone): array
    {
        $data = $request->validate([
            'period' => ['nullable', 'in:today,yesterday,week,month,custom'],
            'start_date' => ['nullable', 'date_format:Y-m-d'], 'end_date' => ['nullable', 'date_format:Y-m-d'],
        ]);
        $period = $data['period'] ?? ($request->filled('start_date') || $request->filled('end_date') ? 'custom' : 'today');
        $today = CarbonImmutable::now($timezone)->startOfDay();
        [$start, $end, $label] = match ($period) {
            'yesterday' => [$today->subDay(), $today->subDay(), 'Yesterday'],
            'week' => [$today->subDays(6), $today, 'Last 7 days'],
            'month' => [$today->startOfMonth(), $today, 'This month'],
            'custom' => [CarbonImmutable::parse($data['start_date'] ?? $today->toDateString(), $timezone), CarbonImmutable::parse($data['end_date'] ?? $today->toDateString(), $timezone), 'Custom range'],
            default => [$today, $today, 'Today'],
        };
        if ($start->greaterThan($end) || $start->diffInDays($end) > 366) {
            throw ValidationException::withMessages(['end_date' => 'Choose an end date after the start, within 366 days.']);
        }

        return ['period' => $period, 'start_date' => $start->toDateString(), 'end_date' => $end->toDateString(), 'label' => $label];
    }
}
