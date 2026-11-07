<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Support\Auditing\Audit;
use App\Support\ContactFields;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Settings/Profile/Edit', [
            'user' => [
                ...$user->only(['id', 'name', 'email', 'phone', 'cnic']),
                'image_url' => $user->image_path ? Storage::disk('public')->url($user->image_path) : null,
            ],
        ]);
    }

    public function update(Request $request, Audit $audit): RedirectResponse
    {
        $user = $request->user();
        ContactFields::normalize($request);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ContactFields::phoneRules(),
            'cnic' => ContactFields::cnicRules(),
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image' => ['sometimes', 'boolean'],
        ]);
        $old = $user->only(['name', 'email', 'phone', 'image_path']);
        $oldPath = $user->image_path;
        $newPath = $request->hasFile('image') ? $request->file('image')->store('avatars', 'public') : null;
        $data = collect($validated)->only(['name', 'email', 'phone', 'cnic'])->all();
        if ($newPath || $request->boolean('remove_image')) {
            $data['image_path'] = $newPath;
        }
        if ($user->email !== $validated['email']) {
            $data['email_verified_at'] = null;
        }
        try {
            $user->forceFill($data)->save();
        } catch (Throwable $exception) {
            if ($newPath) {
                Storage::disk('public')->delete($newPath);
            }
            throw $exception;
        }
        if ($oldPath && $oldPath !== $user->image_path) {
            Storage::disk('public')->delete($oldPath);
        }
        $audit->record('profile.updated', $user, $old, $user->only(array_keys($old)));

        return back()->with('status', 'Profile updated successfully.');
    }

    public function updatePassword(Request $request, Audit $audit): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);
        $request->user()->update(['password' => Hash::make($validated['password'])]);
        $request->session()->regenerate();
        $audit->record('profile.password_updated', $request->user());

        return back()->with('status', 'Password updated successfully.');
    }
}
