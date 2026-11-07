<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Auditing\Audit;
use App\Support\ContactFields;
use App\Support\ShopRole;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class StaffController extends Controller
{
    public function index(TenantContext $context): Response
    {
        return Inertia::render('Settings/StaffList', [
            'staff' => $context->get()->users()->orderBy('name')->get()->map(fn (User $user) => [
                ...$user->only(['id', 'name', 'email', 'phone', 'cnic']),
                'role' => ShopRole::normalize($user->pivot->role),
                'image_url' => $user->image_path ? Storage::disk('public')->url($user->image_path) : null,
            ]),
        ]);
    }

    public function store(Request $request, TenantContext $context, Audit $audit): RedirectResponse
    {
        ContactFields::normalize($request);
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'role' => ['required', Rule::in([ShopRole::ADMIN, ShopRole::WORKER])],
            'existing_user' => ['required', 'boolean'],
            'name' => ['nullable', 'required_if:existing_user,false', 'string', 'max:255'],
            'password' => ['nullable', 'required_if:existing_user,false', Rules\Password::defaults()],
            'phone' => ContactFields::phoneRules(),
            'cnic' => ContactFields::cnicRules(),
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);
        $tenant = $context->get();
        $newPath = null;
        try {
            DB::transaction(function () use ($request, $validated, $tenant, $audit, &$newPath) {
                $tenant->newQuery()->whereKey($tenant->id)->lockForUpdate()->firstOrFail();
                $user = User::where('email', $validated['email'])->first();
                if ($request->boolean('existing_user')) {
                    if (! $user || $user->is_super_admin) {
                        throw ValidationException::withMessages(['email' => 'No eligible existing account was found with this email.']);
                    }
                } else {
                    if ($user) {
                        throw ValidationException::withMessages(['email' => 'This email already has an account. Use Link existing account.']);
                    }
                    if ($request->hasFile('image')) {
                        $newPath = $request->file('image')->store('avatars', 'public');
                    }
                    $user = User::create([
                        ...collect($validated)->only(['name', 'email', 'password', 'phone', 'cnic'])->all(),
                        'image_path' => $newPath,
                        'is_super_admin' => false,
                    ]);
                    $audit->record('staff.user_created', $user, null, $user->only(['name', 'email']));
                }
                if ($tenant->users()->whereKey($user->id)->exists()) {
                    throw ValidationException::withMessages(['email' => 'This user is already a member of this shop.']);
                }
                $tenant->users()->attach($user->id, [
                    'role' => $validated['role'],
                    'is_default' => ! $user->tenants()->exists(),
                ]);
                $audit->record('staff.linked', $user, null, ['role' => $validated['role']]);
            });
        } catch (Throwable $exception) {
            if ($newPath) {
                Storage::disk('public')->delete($newPath);
            }
            throw $exception;
        }

        return back()->with('status', 'Staff member added successfully.');
    }

    public function update(Request $request, int $userId, TenantContext $context, Audit $audit): RedirectResponse
    {
        $validated = $request->validate(['role' => ['required', Rule::in([ShopRole::ADMIN, ShopRole::WORKER])]]);
        $tenant = $context->get();
        DB::transaction(function () use ($tenant, $userId, $validated, $audit) {
            $tenant->newQuery()->whereKey($tenant->id)->lockForUpdate()->firstOrFail();
            $user = $tenant->users()->findOrFail($userId);
            if ($validated['role'] !== ShopRole::ADMIN) {
                $this->guardLastAdmin($tenant, $user);
            }
            $oldRole = $user->pivot->role;
            $tenant->users()->updateExistingPivot($user->id, ['role' => $validated['role']]);
            $audit->record('staff.role_updated', $user, ['role' => $oldRole], $validated);
        });

        return back()->with('status', 'Staff role updated successfully.');
    }

    public function destroy(int $userId, TenantContext $context, Audit $audit): RedirectResponse
    {
        $tenant = $context->get();
        DB::transaction(function () use ($tenant, $userId, $audit) {
            $tenant->newQuery()->whereKey($tenant->id)->lockForUpdate()->firstOrFail();
            $user = $tenant->users()->findOrFail($userId);
            if ($user->id === auth()->id()) {
                throw ValidationException::withMessages(['error' => 'You cannot remove your own shop access.']);
            }
            $this->guardLastAdmin($tenant, $user);
            $tenant->users()->detach($user->id);
            $audit->record('staff.unlinked', $user);
        });

        return back()->with('status', 'Staff member removed successfully.');
    }

    private function guardLastAdmin(Tenant $tenant, User $user): void
    {
        if (ShopRole::normalize($user->pivot->role) === ShopRole::ADMIN
            && $tenant->users()->wherePivotIn('role', ['admin', 'owner'])->count() <= 1) {
            throw ValidationException::withMessages(['role' => 'A shop must keep at least one admin.']);
        }
    }
}
