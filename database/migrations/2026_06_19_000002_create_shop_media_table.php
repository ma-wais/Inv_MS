<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('filename');
            $table->string('path');
            $table->string('label'); // e.g. 'Shop', 'Worker', 'Other'
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'label']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_media');
    }
};
