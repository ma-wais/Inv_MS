<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('ventory:backup --prune')
    ->dailyAt(config('backups.time'))
    ->timezone(config('backups.timezone'))
    ->withoutOverlapping(120)
    ->appendOutputTo(storage_path('logs/backups.log'));
