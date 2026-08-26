<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmbeddableMap;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmbeddableMapController extends Controller
{
    public function index(): JsonResponse
    {
        $maps = EmbeddableMap::query()
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (EmbeddableMap $map) => $map->toFrontendArray());

        return response()->json($maps);
    }

    public function show(string $token): JsonResponse
    {
        $map = EmbeddableMap::query()->where('token', $token)->firstOrFail();

        return response()->json($map->toFrontendArray())
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'districts' => 'nullable|array',
        ]);

        $map = EmbeddableMap::create([
            'title' => $data['title'] ?? 'Hartă nouă',
            'districts' => $data['districts'] ?? [],
        ]);

        return response()->json($map->toFrontendArray(), 201);
    }

    public function update(Request $request, string $token): JsonResponse
    {
        $map = EmbeddableMap::query()->where('token', $token)->firstOrFail();

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'districts' => 'sometimes|array',
        ]);

        $map->fill($data);
        $map->save();

        return response()->json($map->fresh()->toFrontendArray());
    }

    public function destroy(string $token): JsonResponse
    {
        $map = EmbeddableMap::query()->where('token', $token)->firstOrFail();
        $map->delete();

        return response()->json(['ok' => true]);
    }
}
