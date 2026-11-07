<?php

namespace Tests\Feature\Maintenance;

use App\Models\User;
use App\Services\Maintenance\DatabaseBackupService;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use ZipArchive;

class BackupRestoreTest extends TestCase
{
    use DatabaseMigrations;

    public function test_compressed_backup_restores_unicode_quotes_nulls_and_schema_to_the_test_database(): void
    {
        $this->assertSame('ventory_test', DB::connection()->getDatabaseName());
        Storage::fake('local');
        $name = "O'Brien ☕ \\store\nsecond line";
        $user = User::factory()->create(['name' => $name, 'phone' => null]);
        DB::table('users')->insert(array_map(fn ($index) => [
            'name' => 'Chunk fixture '.$index, 'email' => 'chunk-'.$index.'@example.test', 'password' => $user->password,
        ], range(1, 501)));
        DB::table('cache')->insert(array_map(fn ($index) => ['key' => 'restore-'.$index, 'value' => 'value-'.$index, 'expiration' => 999999999], range(1, 501)));
        $archiveName = app(DatabaseBackupService::class)->create();
        $this->assertStringEndsWith('.sql.zip', $archiveName);
        $archive = new ZipArchive;
        $this->assertTrue($archive->open(Storage::disk('local')->path('backups/'.$archiveName)) === true);
        $sql = $archive->getFromIndex(0);
        $archive->close();
        $user->update(['name' => 'Changed']);
        DB::unprepared($sql);
        $this->assertSame($name, User::findOrFail($user->id)->name);
        $this->assertNull(User::findOrFail($user->id)->phone);
        $this->assertSame(0, DB::table('products')->count());
        $this->assertSame(502, User::count());
        $this->assertSame(501, DB::table('cache')->count());
        $this->assertCount(1, app(DatabaseBackupService::class)->files());
        $this->assertSame([], array_values(array_filter(Storage::disk('local')->files('backups'), fn ($path) => str_ends_with($path, '.partial'))));
    }
}
