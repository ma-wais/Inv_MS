<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['users', 'customers', 'suppliers'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('cnic', 13)->nullable();
            });
        }
        DB::table('tenant_user')->where('role', 'owner')->update(['role' => 'admin']);
        DB::table('tenant_user')->whereIn('role', ['manager', 'cashier', 'accountant', 'viewer'])
            ->update(['role' => 'worker']);
    }

    public function down(): void
    {
        DB::table('tenant_user')->where('role', 'admin')->update(['role' => 'owner']);
        DB::table('tenant_user')->where('role', 'worker')->update(['role' => 'cashier']);
        foreach (['users', 'customers', 'suppliers'] as $tableName) {
            Schema::table($tableName, fn (Blueprint $table) => $table->dropColumn('cnic'));
        }
    }
};
