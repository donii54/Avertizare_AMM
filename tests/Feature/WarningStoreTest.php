<?php

namespace Tests\Feature;

use App\Models\Warning;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WarningStoreTest extends TestCase
{
    use RefreshDatabase;

    private function loginAdmin(): void
    {
        $this->seed(AdminUserSeeder::class);

        $this->postJson('/api/login', [
            'user' => 'admin',
            'password' => 'admin',
        ])->assertOk();
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'phenomenon' => 'Ploi puternice',
            'emitDate' => '2026-08-26T10:00',
            'intervalFrom' => '2026-08-26T12:00',
            'intervalTo' => '2026-08-26T18:00',
            'codes' => [
                ['code' => 'COD PORTOCALIU', 'description' => 'Vânt puternic'],
            ],
            'districts' => [
                ['name' => 'Chișinău', 'label' => 'CHI', 'color' => '#FF8A00'],
            ],
            'mapImage' => null,
        ], $overrides);
    }

    public function test_store_rejects_districts_painted_with_undeclared_code_color(): void
    {
        $this->loginAdmin();

        $this->postJson('/api/warnings', $this->payload([
            'districts' => [
                ['name' => 'Chișinău', 'label' => 'CHI', 'color' => '#FF8A00'],
                ['name' => 'Cahul', 'label' => 'CAH', 'color' => '#FFED00'],
            ],
        ]))->assertUnprocessable()
            ->assertJsonFragment(['districts' => ['Fiecare culoare de pe hartă trebuie să aibă un cod adăugat și descris, fără culori nedeclarate.']]);

        $this->assertSame(0, Warning::count());
    }

    public function test_store_rejects_declared_code_missing_from_the_map(): void
    {
        $this->loginAdmin();

        $this->postJson('/api/warnings', $this->payload([
            'codes' => [
                ['code' => 'COD PORTOCALIU', 'description' => 'Vânt puternic'],
                ['code' => 'COD GALBEN', 'description' => 'Ploi'],
            ],
            'districts' => [
                ['name' => 'Chișinău', 'label' => 'CHI', 'color' => '#FF8A00'],
            ],
        ]))->assertUnprocessable();

        $this->assertSame(0, Warning::count());
    }

    public function test_store_accepts_matching_codes_and_district_colors(): void
    {
        $this->loginAdmin();

        $this->postJson('/api/warnings', $this->payload([
            'codes' => [
                ['code' => 'COD PORTOCALIU', 'description' => 'Vânt puternic'],
                ['code' => 'COD GALBEN', 'description' => 'Ploi'],
            ],
            'districts' => [
                ['name' => 'Chișinău', 'label' => 'CHI', 'color' => '#FF8A00'],
                ['name' => 'Cahul', 'label' => 'CAH', 'color' => '#FFED00'],
            ],
        ]))->assertCreated()
            ->assertJsonPath('codes.0.code', 'COD PORTOCALIU');

        $this->assertSame(1, Warning::count());
    }
}
