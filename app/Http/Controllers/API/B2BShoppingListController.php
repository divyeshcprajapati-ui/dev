<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\B2BShoppingList;
use App\Services\B2BNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class B2BShoppingListController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $query = B2BShoppingList::with('items')
            ->where('shop_domain', $shop)
            ->orderBy('created_at', 'desc');

        $isAdmin = (bool) $request->attributes->get('shopify_admin_authenticated', false);
        $email = $request->query('email');

        if (!$isAdmin) {
            if (!$email) {
                return response()->json(['success' => false, 'message' => 'Customer email is required.'], 400);
            }
            $query->where('customer_email', $email);
        } elseif ($email) {
            $query->where('customer_email', $email);
        }

        if ($request->query('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
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
            'name' => 'required|string|max:180',
            'customer_email' => 'required|email|max:255',
            'customer_name' => 'nullable|string|max:180',
            'company_name' => 'nullable|string|max:180',
            'status' => 'nullable|in:Draft,Pending Approval',
            'notes' => 'nullable|string|max:1000',
            'items' => 'nullable|array',
            'items.*.product_title' => 'required_with:items|string|max:255',
            'items.*.variant_id' => 'nullable|string|max:64',
            'items.*.sku' => 'nullable|string|max:120',
            'items.*.price' => 'nullable|numeric|min:0',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.image_url' => 'nullable|string',
        ]);

        $status = $validated['status'] ?? 'Draft';

        $list = B2BShoppingList::create([
            'shop_domain' => $shop,
            'name' => $validated['name'],
            'customer_email' => $validated['customer_email'],
            'customer_name' => $validated['customer_name'] ?? null,
            'company_name' => $validated['company_name'] ?? null,
            'status' => $status,
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($validated['items'] ?? [] as $item) {
            $list->items()->create([
                'product_title' => $item['product_title'],
                'variant_id' => $item['variant_id'] ?? null,
                'sku' => $item['sku'] ?? null,
                'price' => (float) ($item['price'] ?? 0),
                'quantity' => (int) $item['quantity'],
                'image_url' => $item['image_url'] ?? null,
            ]);
        }

        if ($status === 'Pending Approval') {
            $notifier = app(B2BNotificationService::class);
            $notifier->sendIfEnabled(
                $shop,
                'list_pending_approval',
                $notifier->resolveStaffEmail($shop),
                "Shopping List Pending Approval: {$list->name}",
                'B2B Shopping List Submitted for Approval',
                [
                    "List Name: {$list->name}",
                    "Buyer: {$list->customer_name} ({$list->customer_email})",
                    "Items: " . $list->items()->count(),
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Shopping list created successfully.',
            'data' => $list->load('items'),
        ], 201);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop') ?? $request->input('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $list = B2BShoppingList::where('shop_domain', $shop)->where('id', $id)->firstOrFail();
        $isAdmin = (bool) $request->attributes->get('shopify_admin_authenticated', false);

        $validated = $request->validate([
            'status' => 'required|in:Draft,Pending Approval,Approved,Rejected',
            'customer_email' => 'nullable|email',
        ]);

        if (!$isAdmin) {
            $email = strtolower(trim((string) ($validated['customer_email'] ?? '')));
            if ($email !== strtolower(trim((string) $list->customer_email)) || $validated['status'] !== 'Pending Approval') {
                return response()->json(['success' => false, 'message' => 'Unauthorized action on shopping list.'], 403);
            }
        }

        $list->update(['status' => $validated['status']]);

        $notifier = app(B2BNotificationService::class);
        if ($validated['status'] === 'Pending Approval') {
            $notifier->sendIfEnabled(
                $shop,
                'list_pending_approval',
                $notifier->resolveStaffEmail($shop),
                "Shopping List Pending Approval: {$list->name}",
                'B2B Shopping List Submitted for Approval',
                [
                    "List Name: {$list->name}",
                    "Buyer: {$list->customer_name} ({$list->customer_email})",
                ]
            );
        } elseif ($validated['status'] === 'Approved') {
            $notifier->sendIfEnabled(
                $shop,
                'list_approved',
                $list->customer_email,
                "Your Shopping List '{$list->name}' Has Been Approved",
                'Shopping List Approved',
                [
                    "Hi {$list->customer_name},",
                    "Your B2B shopping list '{$list->name}' has been approved and is ready to add to cart.",
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => "Shopping list marked as {$validated['status']}.",
            'data' => $list->load('items'),
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop') ?? $request->input('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $list = B2BShoppingList::where('shop_domain', $shop)->where('id', $id)->firstOrFail();
        $isAdmin = (bool) $request->attributes->get('shopify_admin_authenticated', false);
        if (!$isAdmin) {
            $email = strtolower(trim((string) ($request->query('email') ?? $request->input('customer_email', ''))));
            if ($email !== strtolower(trim((string) $list->customer_email))) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }
        }

        $list->delete();
        return response()->json(['success' => true, 'message' => 'Shopping list deleted.']);
    }
}
