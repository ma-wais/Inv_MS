<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Auditing\Audit;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(TenantContext $tenantContext): Response
    {
        $tenant = $tenantContext->get();
        $staff = $tenant->users()
            ->orderBy('name')
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->pivot->role,
                    'image_url' => $user->image_path ? \Illuminate\Support\Facades\Storage::url($user->image_path) : null,
                ];
            });

        return Inertia::render('Settings/StaffList', [
            'staff' => $staff,
        ]);
    }

    public function store(Request $request, TenantContext $tenantContext, Audit $audit): RedirectResponse
    {
        $tenant = $tenantContext->get();

        $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'role' => ['required', 'string', 'in:owner,manager,cashier,accountant,viewer'],
            // If new user
            'name' => ['nullable', 'required_without:existing_user', 'string', 'max:255'],
            'password' => ['nullable', 'required_without:existing_user', Rules\Password::defaults()],
            'image' => ['nullable', 'image', 'max:2048'], // Max 2MB
        ]);

        $user = User::where('email', $request->email)->first();

        DB::transaction(function () use ($request, $tenant, &$user, $audit) {
            if (!$user) {
                // Create user
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'is_super_admin' => false,
                ]);
                $audit->record('staff.user_created', $user, null, $user->toArray());
            }

            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('avatars', 'public');
                $user->update(['image_path' => $path]);
            }

            // Check if already linked
            if ($tenant->users()->where('users.id', $user->id)->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'email' => 'This user is already a member of this shop.',
                ]);
            }

            // Link to tenant
            $tenant->users()->attach($user->id, [
                'role' => $request->role,
                'is_default' => !$user->tenants()->exists()
            ]);

            $audit->record('staff.linked', $user, null, ['role' => $request->role]);
        });

        return redirect()->back()->with('status', 'Staff member added successfully.');
    }

    public function update(Request $request, int $userId, TenantContext $tenantContext, Audit $audit): RedirectResponse
    {
        $tenant = $tenantContext->get();
        $user = $tenant->users()->findOrFail($userId);

        $request->validate([
            'role' => ['required', 'string', 'in:owner,manager,cashier,accountant,viewer'],
        ]);

        // Prevent self role-demotion if they are the only owner
        if ($user->id === auth()->id() && $request->role !== 'owner') {
            $ownersCount = $tenant->users()->wherePivot('role', 'owner')->count();
            if ($ownersCount <= 1) {
                return redirect()->back()->withErrors(['role' => 'You are the only owner of this shop and cannot demote yourself.']);
            }
        }

        $oldRole = $user->pivot->role;
        $tenant->users()->updateExistingPivot($user->id, ['role' => $request->role]);

        $audit->record('staff.role_updated', $user, ['role' => $oldRole], ['role' => $request->role]);

        return redirect()->back()->with('status', 'Staff role updated successfully.');
    }

    public function destroy(int $userId, TenantContext $tenantContext, Audit $audit): RedirectResponse
    {
        $tenant = $tenantContext->get();
        $user = $tenant->users()->findOrFail($userId);

        if ($user->id === auth()->id()) {
            return redirect()->back()->withErrors(['error' => 'You cannot remove yourself from your own shop.']);
        }

        $tenant->users()->detach($user->id);

        $audit->record('staff.unlinked', $user, null, null);

        return redirect()->back()->with('status', 'Staff member removed successfully.');
    }
}
