<?php

namespace App\Http\Controllers;

use App\Models\ShopMedia;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ShopMediaController extends Controller
{
    public function index(): Response
    {
        $mediaList = ShopMedia::query()
            ->orderByDesc('created_at')
            ->get()
            ->map(function (ShopMedia $media) {
                return [
                    'id' => $media->id,
                    'filename' => $media->filename,
                    'url' => Storage::url($media->path),
                    'label' => $media->label,
                    'description' => $media->description,
                    'created_at' => $media->created_at->toDateString(),
                ];
            });

        return Inertia::render('Settings/MediaGallery', [
            'mediaList' => $mediaList,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'image', 'max:5120'], // Max 5MB
            'label' => ['required', 'string', 'in:Shop,Workers,Other'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $file = $request->file('file');
        $path = $file->store('media', 'public');

        ShopMedia::create([
            'filename' => $file->getClientOriginalName(),
            'path' => $path,
            'label' => $request->label,
            'description' => $request->description,
        ]);

        return back()->with('status', 'Picture uploaded successfully.');
    }

    public function destroy(ShopMedia $media): RedirectResponse
    {
        // Delete file from disk
        if (Storage::disk('public')->exists($media->path)) {
            Storage::disk('public')->delete($media->path);
        }

        // Delete DB record
        $media->delete();

        return back()->with('status', 'Picture deleted successfully.');
    }
}
