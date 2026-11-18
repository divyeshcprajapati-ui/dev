<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\B2BCreditAccount;
use App\Models\B2BLedgerEntry;
use App\Services\B2BNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class B2BCreditFinanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $query = B2BCreditAccount::with('entries')
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

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function upsertAccount(Request $request): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $validated = $request->validate([
            'company_name' => 'required|string|max:180',
            'customer_email' => 'required|email|max:255',
            'credit_limit' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:8',
            'payment_terms' => 'nullable|string|max:64',
            'status' => 'nullable|in:Active,Suspended',
        ]);

        $existing = B2BCreditAccount::where('shop_domain', $shop)
            ->where('company_name', $validated['company_name'])
            ->first();

        $limitChanged = !$existing || (float) $existing->credit_limit !== (float) $validated['credit_limit'];

        $account = B2BCreditAccount::updateOrCreate(
            [
                'shop_domain' => $shop,
                'company_name' => $validated['company_name'],
            ],
            [
                'customer_email' => strtolower(trim($validated['customer_email'])),
                'credit_limit' => (float) $validated['credit_limit'],
                'currency' => strtoupper($validated['currency'] ?? 'USD'),
                'payment_terms' => $validated['payment_terms'] ?? 'Net 30',
                'status' => $validated['status'] ?? 'Active',
            ]
        );

        if ($limitChanged && (float) $account->credit_limit > 0) {
            app(B2BNotificationService::class)->sendIfEnabled(
                $shop,
                'credit_assigned',
                $account->customer_email,
                "Credit Limit Assigned — {$account->company_name}",
                'Wholesale Credit Account Updated',
                [
                    "Company: {$account->company_name}",
                    "Assigned Credit Limit: {$account->currency} " . number_format((float) $account->credit_limit, 2),
                    "Payment Terms: {$account->payment_terms}",
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Credit account saved successfully.',
            'data' => $account->load('entries'),
        ]);
    }

    public function recordTransaction(Request $request, $accountId): JsonResponse
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
        }

        $account = B2BCreditAccount::where('shop_domain', $shop)
            ->where('id', $accountId)
            ->firstOrFail();

        $validated = $request->validate([
            'type' => 'required|in:charge,payment,adjustment',
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'nullable|string|max:120',
            'notes' => 'nullable|string|max:500',
        ]);

        $amount = (float) $validated['amount'];
        $newBalance = (float) $account->balance_used;

        if ($validated['type'] === 'charge') {
            if ($account->status !== 'Active') {
                return response()->json(['success' => false, 'message' => 'Credit account is suspended.'], 422);
            }
            if (($newBalance + $amount) > (float) $account->credit_limit) {
                return response()->json(['success' => false, 'message' => 'Charge exceeds available credit limit.'], 422);
            }
            $newBalance += $amount;
        } elseif ($validated['type'] === 'payment') {
            $newBalance = max(0.0, $newBalance - $amount);
        } else {
            $newBalance = max(0.0, $amount);
        }

        $entry = B2BLedgerEntry::create([
            'b2b_credit_account_id' => $account->id,
            'shop_domain' => $shop,
            'type' => $validated['type'],
            'amount' => $amount,
            'reference' => $validated['reference'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'created_by' => 'Merchant Admin',
        ]);

        $account->update(['balance_used' => round($newBalance, 2)]);

        // Low credit alert when remaining credit falls below 10% of credit limit
        if ((float) $account->credit_limit > 0) {
            $remainingRatio = $account->available_credit / (float) $account->credit_limit;
            if ($remainingRatio < 0.10) {
                $notifier = app(B2BNotificationService::class);
                $notifier->sendIfEnabled(
                    $shop,
                    'credit_low_alert',
                    $notifier->resolveStaffEmail($shop),
                    "Low Credit Alert: {$account->company_name}",
                    'Low Remaining B2B Credit Balance',
                    [
                        "Company: {$account->company_name} ({$account->customer_email})",
                        "Credit Limit: {$account->currency} " . number_format((float) $account->credit_limit, 2),
                        "Used Balance: {$account->currency} " . number_format((float) $account->balance_used, 2),
                        "Remaining Credit: {$account->currency} " . number_format($account->available_credit, 2),
                    ]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Ledger entry recorded.',
            'data' => [
                'account' => $account->fresh()->load('entries'),
                'entry' => $entry,
            ],
        ], 201);
    }
}
