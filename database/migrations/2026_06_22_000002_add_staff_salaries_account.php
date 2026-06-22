<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tenants = DB::table('tenants')->get();
        foreach ($tenants as $tenant) {
            $expensesParent = DB::table('accounts')
                ->where('tenant_id', $tenant->id)
                ->where('code', '5000')
                ->first();

            if ($expensesParent) {
                $exists = DB::table('accounts')
                    ->where('tenant_id', $tenant->id)
                    ->where('code', '5300')
                    ->exists();

                if (!$exists) {
                    DB::table('accounts')->insert([
                        'tenant_id' => $tenant->id,
                        'parent_id' => $expensesParent->id,
                        'code' => '5300',
                        'name' => 'Staff Salaries',
                        'type' => 'expense',
                        'normal_balance' => 'debit',
                        'is_system' => true,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('accounts')->where('code', '5300')->delete();
    }
};
