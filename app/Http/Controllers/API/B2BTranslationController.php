<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\B2BTranslation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class B2BTranslationController extends Controller
{
    public const DEFAULT_STRINGS = [
        'registration' => [
            'title' => 'B2B Registration',
            'description' => 'Fill out the details below to register your company account.',
            'submit_button' => 'Register',
            'success_message' => 'Your B2B application has been submitted successfully and is under review.',
        ],
        'quotation' => [
            'add_to_quote' => 'Add to Quote',
            'request_cart_quote' => 'Request a Quote for Cart',
            'my_quotations' => 'My Quotations',
            'approve_proposal' => 'Approve Proposal',
            'reject_proposal' => 'Reject Proposal',
            'proceed_to_checkout' => 'Proceed to Checkout',
        ],
        'bulk' => [
            'title' => 'Quick Order Pad',
            'sku_placeholder' => 'Enter SKU or product name',
            'add_row' => 'Add Row',
            'add_to_cart' => 'Add All to Cart',
        ],
        'csv' => [
            'title' => 'CSV Bulk Order Upload',
            'instructions' => 'Upload a CSV file with columns: sku,quantity',
            'validate_button' => 'Validate CSV',
            'add_to_cart' => 'Add Valid Items to Cart',
        ],
        'list' => [
            'title' => 'Shopping Lists',
            'create_list' => 'Create Shopping List',
            'submit_approval' => 'Submit for Approval',
            'add_list_to_cart' => 'Add List to Cart',
        ],
        'members' => [
            'title' => 'Team Members & Permissions',
            'add_member' => 'Add Team Member',
            'role_admin' => 'Admin',
            'role_buyer' => 'Buyer',
            'role_viewer' => 'Viewer',
        ],
    ];

    public function index(Request $request): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $locale = strtolower(trim((string) $request->query('locale', '')));
        $section = $request->query('section');

        $locales = B2BTranslation::where('shop_domain', $shop)
            ->distinct()
            ->pluck('locale')
            ->values()
            ->toArray();

        $query = B2BTranslation::where('shop_domain', $shop);
        if ($locale) {
            $query->where('locale', $locale);
        }
        if ($section) {
            $query->where('section', $section);
        }

        $rows = $query->get();
        $grouped = [];
        foreach ($rows as $row) {
            $grouped[$row->locale][$row->section][$row->translation_key] = $row->value;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'locales' => $locales,
                'defaults' => self::DEFAULT_STRINGS,
                'translations' => $grouped,
            ],
        ]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $validated = $request->validate([
            'locale' => 'required|string|max:16',
            'section' => 'required|string|max:64',
            'entries' => 'required|array',
        ]);

        $locale = strtolower(trim($validated['locale']));
        $section = trim($validated['section']);

        foreach ($validated['entries'] as $key => $value) {
            B2BTranslation::updateOrCreate(
                [
                    'shop_domain' => $shop,
                    'locale' => $locale,
                    'section' => $section,
                    'translation_key' => (string) $key,
                ],
                ['value' => (string) ($value ?? '')]
            );
        }

        return response()->json([
            'success' => true,
            'message' => "Translations saved for {$locale} ({$section}).",
        ]);
    }

    public function deleteLocale(Request $request, string $locale): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        B2BTranslation::where('shop_domain', $shop)
            ->where('locale', strtolower(trim($locale)))
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "Locale '{$locale}' deleted.",
        ]);
    }
}
