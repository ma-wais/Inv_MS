<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));

        $logs = AuditLog::query()
            ->orderByDesc('id')
            ->when($search, function ($query) use ($search): void {
                $query->where('event', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('auditable', function ($q) use ($search) {
                        // Morph relation search if needed, otherwise simple fallback
                    });
            })
            ->paginate(50)
            ->through(function ($log) {
                // Fetch User and Tenant manually or load them
                $user = $log->user_id ? User::find($log->user_id) : null;
                $tenant = $log->tenant_id ? Tenant::find($log->tenant_id) : null;
                
                return [
                    'id' => $log->id,
                    'event' => $log->event,
                    'tenant_name' => $tenant ? $tenant->name : 'System-Wide',
                    'user_name' => $user ? $user->name : 'Guest/Anonymous',
                    'user_email' => $user ? $user->email : '—',
                    'auditable_type' => class_basename($log->auditable_type),
                    'auditable_id' => $log->auditable_id,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at->toDateTimeString(),
                    'old_values' => $log->old_values,
                    'new_values' => $log->new_values,
                ];
            })
            ->withQueryString();

        return Inertia::render('SuperAdmin/ActivityLogs', [
            'logs' => $logs,
            'filters' => ['search' => $search],
        ]);
    }
}
