<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\B2BCompanyMember;
use App\Services\B2BNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class B2BCompanyMemberController extends Controller
{
    public const ROLE_DEFAULTS = [
        'Admin' => ['manage_team' => true, 'place_orders' => true, 'approve_lists' => true, 'view_finance' => true, 'request_quotes' => true],
        'Buyer' => ['manage_team' => false, 'place_orders' => true, 'approve_lists' => false, 'view_finance' => false, 'request_quotes' => true],
        'Viewer' => ['manage_team' => false, 'place_orders' => false, 'approve_lists' => false, 'view_finance' => true, 'request_quotes' => false],
    ];

    public function index(Request $request): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $query = B2BCompanyMember::where('shop_domain', $shop)->orderBy('created_at', 'desc');
        $company = $request->query('company_name');
        $email = $request->query('email');
        $isAdmin = (bool) $request->attributes->get('shopify_admin_authenticated', false);

        if (!$isAdmin) {
            if ($company) {
                $query->where('company_name', $company);
            } elseif ($email) {
                $member = B2BCompanyMember::where('shop_domain', $shop)->where('email', $email)->first();
                if (!$member) {
                    return response()->json(['success' => true, 'data' => []]);
                }
                $query->where('company_name', $member->company_name);
            } else {
                return response()->json(['success' => false, 'message' => 'Company or email is required.'], 400);
            }
        } elseif ($company) {
            $query->where('company_name', $company);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop') ?? $request->input('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $validated = $request->validate([
            'company_name' => 'required|string|max:180',
            'name' => 'required|string|max:180',
            'email' => 'required|email|max:255',
            'role' => 'required|in:Admin,Buyer,Viewer',
            'permissions' => 'nullable|array',
            'actor_email' => 'nullable|email|max:255',
        ]);

        // Storefront (non-admin-session) invites are strictly limited to Active company Admins
        $isMerchantAdmin = (bool) $request->attributes->get('shopify_admin_authenticated', false);
        if (!$isMerchantAdmin) {
            $actorEmail = strtolower(trim((string) ($validated['actor_email'] ?? '')));
            $actor = $actorEmail ? B2BCompanyMember::where('shop_domain', $shop)
                ->where('company_name', $validated['company_name'])
                ->where('email', $actorEmail)
                ->where('status', 'Active')
                ->where('role', 'Admin')
                ->first() : null;

            if (!$actor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only active company Admins can add new team members from the storefront.',
                ], 403);
            }
        }

        $permissions = $validated['permissions'] ?? self::ROLE_DEFAULTS[$validated['role']];

        $member = B2BCompanyMember::updateOrCreate(
            [
                'shop_domain' => $shop,
                'company_name' => $validated['company_name'],
                'email' => strtolower(trim($validated['email'])),
            ],
            [
                'name' => $validated['name'],
                'role' => $validated['role'],
                'permissions' => $permissions,
                'status' => 'Active',
            ]
        );

        app(B2BNotificationService::class)->sendIfEnabled(
            $shop,
            'member_added',
            $member->email,
            "You've Been Added to {$member->company_name} B2B Team",
            "Welcome to {$member->company_name}",
            [
                "Hi {$member->name},",
                "You have been added as a {$member->role} for {$member->company_name}.",
                'Log in to our store to access your wholesale account capabilities.',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Team member saved successfully.',
            'data' => $member,
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $member = B2BCompanyMember::where('shop_domain', $shop)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'role' => 'sometimes|in:Admin,Buyer,Viewer',
            'permissions' => 'sometimes|array',
            'status' => 'sometimes|in:Active,Inactive',
        ]);

        if (isset($validated['role']) && !isset($validated['permissions'])) {
            $validated['permissions'] = self::ROLE_DEFAULTS[$validated['role']];
        }

        $roleChanged = isset($validated['role']) && $validated['role'] !== $member->role;
        $member->update($validated);

        if ($roleChanged) {
            app(B2BNotificationService::class)->sendIfEnabled(
                $shop,
                'member_role_updated',
                $member->email,
                "Your B2B Team Role Was Updated — {$member->company_name}",
                'Role & Permissions Updated',
                [
                    "Hi {$member->name},",
                    "Your role for {$member->company_name} has been updated to: {$member->role}.",
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Member updated successfully.',
            'data' => $member,
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $member = B2BCompanyMember::where('shop_domain', $shop)->where('id', $id)->firstOrFail();
        $member->delete();

        return response()->json(['success' => true, 'message' => 'Team member removed.']);
    }
}
