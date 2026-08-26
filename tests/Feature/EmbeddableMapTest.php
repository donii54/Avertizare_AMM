<?php

namespace Tests\Feature;

use App\Models\EmbeddableMap;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmbeddableMapTest extends TestCase
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

    public function test_studio_redirects_guests_to_login(): void
    {
        $this->get('/studio')->assertRedirect('/login');
    }

    public function test_embed_page_is_public(): void
    {
        $map = EmbeddableMap::create([
            'title' => 'Test',
            'districts' => [],
        ]);

        $this->get('/embed/'.$map->token)
            ->assertOk()
            ->assertSee('embed-map', false)
            ->assertHeaderMissing('X-Frame-Options');
    }

    public function test_public_can_read_map_json_but_cannot_list_or_create(): void
    {
        $map = EmbeddableMap::create([
            'title' => 'Public',
            'districts' => [
                ['name' => 'Cahul', 'label' => 'CH', 'color' => '#FF8A00'],
            ],
        ]);

        $this->getJson('/api/maps/'.$map->token)
            ->assertOk()
            ->assertJsonPath('title', 'Public')
            ->assertJsonPath('districts.0.color', '#FF8A00');

        $this->getJson('/api/maps')->assertUnauthorized();
        $this->postJson('/api/maps', ['title' => 'Nope'])->assertUnauthorized();
    }

    public function test_admin_can_create_update_and_widget_sees_new_colors(): void
    {
        $this->loginAdmin();

        $created = $this->postJson('/api/maps', [
            'title' => 'Hartă nouă',
            'districts' => [],
        ])->assertCreated()->json();

        $token = $created['token'];

        $this->putJson('/api/maps/'.$token, [
            'title' => 'Hartă actualizată',
            'districts' => [
                ['name' => 'Cahul', 'label' => 'CH', 'color' => '#FFED00'],
            ],
        ])->assertOk()->assertJsonPath('title', 'Hartă actualizată');

        $this->getJson('/api/maps/'.$token)
            ->assertOk()
            ->assertJsonPath('title', 'Hartă actualizată')
            ->assertJsonPath('districts.0.name', 'Cahul');
    }

    public function test_admin_studio_page_loads_after_login(): void
    {
        $this->loginAdmin();

        $this->get('/studio')
            ->assertOk()
            ->assertSee('Hărți pentru widget', false)
            ->assertSee('Hartă nouă', false);
    }
}
