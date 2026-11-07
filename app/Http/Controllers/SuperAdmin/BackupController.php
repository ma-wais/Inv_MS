<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\Maintenance\DatabaseBackupService;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class BackupController extends Controller
{
    public function index(DatabaseBackupService $backups): Response
    {
        return Inertia::render('SuperAdmin/Backups', [
            'backups' => $backups->files(),
            'maintenance' => ['time' => config('backups.time'), 'timezone' => config('backups.timezone'), 'retention_days' => config('backups.retention_days')],
        ]);
    }

    public function store(DatabaseBackupService $backups, Audit $audit): RedirectResponse
    {
        try {
            $filename = $backups->create();
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors(['backup' => 'Backup failed: '.$exception->getMessage()]);
        }
        $audit->record('system.database.backed_up', null, null, ['filename' => $filename]);

        return back()->with('status', 'System database backup generated successfully.');
    }

    public function download(string $filename, DatabaseBackupService $backups): BinaryFileResponse
    {
        abort_unless($backups->isArchive($filename) && Storage::disk('local')->exists('backups/'.$filename), 404);

        return response()->download(Storage::disk('local')->path('backups/'.$filename));
    }

    public function destroy(string $filename, DatabaseBackupService $backups, Audit $audit): RedirectResponse
    {
        abort_unless($backups->isArchive($filename) && Storage::disk('local')->exists('backups/'.$filename), 404);
        if (! Storage::disk('local')->delete('backups/'.$filename)) {
            return back()->withErrors(['backup' => 'Could not delete this backup.']);
        }
        $audit->record('system.database.backup.deleted', null, null, ['filename' => $filename]);

        return back()->with('status', 'Backup deleted.');
    }
}
