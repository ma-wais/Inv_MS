<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Support\ShopRole;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach (ShopRole::PERMISSIONS as $permission) {
            Permission::firstOrCreate(['slug' => $permission], [
                'name' => ucfirst(str_replace('.', ' ', $permission)), 'group' => explode('.', $permission)[0],
            ]);
        }
    }
}
