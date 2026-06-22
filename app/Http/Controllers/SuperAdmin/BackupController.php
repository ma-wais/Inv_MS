<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Support\Auditing\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    protected string $backupDir;

    public function __construct()
    {
        $this->backupDir = storage_path('app/backups');
        if (!file_exists($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
        }
    }

    public function index(): Response
    {
        $files = [];
        if (file_exists($this->backupDir)) {
            $rawFiles = array_diff(scandir($this->backupDir), ['.', '..']);
            foreach ($rawFiles as $file) {
                $filePath = $this->backupDir . '/' . $file;
                if (is_file($filePath)) {
                    $files[] = [
                        'filename' => $file,
                        'size' => round(filesize($filePath) / 1024 / 1024, 2) . ' MB',
                        'created_at' => date('Y-m-d H:i:s', filemtime($filePath)),
                    ];
                }
            }
        }

        usort($files, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

        return Inertia::render('SuperAdmin/Backups', [
            'backups' => $files,
        ]);
    }

    public function store(Audit $audit): RedirectResponse
    {
        @ini_set('max_execution_time', 0);
        @set_time_limit(0);

        $dbConnection = config('database.default');
        $filename = 'full_backup_' . date('Ymd_His') . '.sql';
        $filePath = $this->backupDir . '/' . $filename;

        if ($dbConnection === 'sqlite') {
            $dbPath = config('database.connections.sqlite.database');
            if (file_exists($dbPath)) {
                copy($dbPath, $filePath);
            }
        } else {
            $sqlContent = "-- Ventory Full Database Backup\n";
            $sqlContent .= "-- Generated on: " . date('Y-m-d H:i:s') . "\n\n";
            $sqlContent .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

            $tables = Schema::getTables();
            foreach ($tables as $tableObj) {
                $tableName = is_object($tableObj) ? ($tableObj->name ?? $tableObj->Name) : $tableObj;
                
                $createResult = DB::select("SHOW CREATE TABLE `{$tableName}`");
                if (!empty($createResult)) {
                    $createRow = (array)$createResult[0];
                    $createSql = $createRow['Create Table'] ?? array_values($createRow)[1];
                    $sqlContent .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
                    $sqlContent .= $createSql . ";\n\n";
                }

                $rows = DB::table($tableName)->get();
                foreach ($rows as $row) {
                    $rowArray = (array)$row;
                    $keys = array_map(fn($k) => "`{$k}`", array_keys($rowArray));
                    $values = array_map(function($v) {
                        if ($v === null) return 'NULL';
                        return "'" . addslashes($v) . "'";
                    }, array_values($rowArray));

                    $sqlContent .= "INSERT INTO `{$tableName}` (" . implode(', ', $keys) . ") VALUES (" . implode(', ', $values) . ");\n";
                }
                $sqlContent .= "\n";
            }

            $sqlContent .= "SET FOREIGN_KEY_CHECKS=1;\n";
            file_put_contents($filePath, $sqlContent);
        }

        $zipFile = $filePath . '.zip';
        $zip = new \ZipArchive();
        if ($zip->open($zipFile, \ZipArchive::CREATE) === true) {
            $zip->addFile($filePath, $filename);
            $zip->close();
            unlink($filePath);
        }

        $audit->record('system.database.backed_up', null, null, ['filename' => $filename . '.zip']);

        return redirect()->back()->with('status', 'System database backup generated successfully.');
    }

    public function download(string $filename): BinaryFileResponse|RedirectResponse
    {
        $filePath = $this->backupDir . '/' . basename($filename);
        if (!file_exists($filePath)) {
            return redirect()->back()->withErrors(['error' => 'Backup file does not exist.']);
        }

        return response()->download($filePath);
    }

    public function destroy(string $filename, Audit $audit): RedirectResponse
    {
        $filePath = $this->backupDir . '/' . basename($filename);
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        $audit->record('system.database.backup.deleted', null, null, ['filename' => $filename]);

        return redirect()->back()->with('status', 'Backup deleted.');
    }
}
