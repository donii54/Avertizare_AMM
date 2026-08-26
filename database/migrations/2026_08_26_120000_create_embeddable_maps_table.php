<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('embeddable_maps', function (Blueprint $table) {
            $table->id();
            $table->string('token', 32)->unique();
            $table->string('title')->default('Hartă');
            $table->json('districts')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('embeddable_maps');
    }
};
