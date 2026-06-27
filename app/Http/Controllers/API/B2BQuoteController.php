<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\B2BQuote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Exception;

class B2BQuoteController extends Controller
{
    /**
     * Get all quotes.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $status = $request->query('status');
            $email = $request->query('email');
            $shop = $request->query('shop');
            
            $query = B2BQuote::orderBy('created_at', 'desc');

            if ($status && $status !== 'all') {
                $query->where('status', ucfirst($status));
            }
            if ($email) {
                $query->where('customer_email', $email);
            }
            if ($shop) {
                $query->where('shop_domain', $shop);
            }

            $quotes = $query->get();

            return response()->json([
                'success' => true,
                'data' => $quotes
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching quotes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quotes.'
            ], 500);
        }
    }

    /**
     * Get a single quote details.
     */
    public function show($id): JsonResponse
    {
        try {
            $quote = B2BQuote::findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $quote
            ]);
        } catch (Exception $e) {
            Log::error("Error fetching quote ID {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quote details.'
            ], 404);
        }
    }

    /**
     * Create a new quote from storefront.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'shop_domain' => 'nullable|string',
                'product_name' => 'required|string',
                'original_price' => 'required|numeric',
                'quoted_price' => 'required|numeric',
                'quantity' => 'required|integer|min:1',
                'subtotal' => 'required|numeric',
                'customer_name' => 'required|string',
                'customer_email' => 'required|email',
                'company_name' => 'required|string',
                'company_location' => 'required|string',
                'shipping_address' => 'required|string',
                'billing_address' => 'nullable|string',
                'expiration_date' => 'nullable|date',
            ]);

            // Generate unique quote number: e.g. Quote #93
            $nextId = (B2BQuote::max('id') ?? 0) + 1;
            $validated['quote_number'] = '#' . $nextId;
            $validated['status'] = 'Pending';

            $quote = B2BQuote::create($validated);

            Log::info('New B2B quote submitted', ['quote_id' => $quote->id]);

            return response()->json([
                'success' => true,
                'message' => 'Quote request submitted successfully.',
                'data' => $quote
            ], 200);
        } catch (Exception $e) {
            Log::error('Error creating quote: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit quote request. ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update quote details (admin/user).
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $quote = B2BQuote::findOrFail($id);

            $validated = $request->validate([
                'quoted_price' => 'nullable|numeric',
                'quantity' => 'nullable|integer|min:1',
                'subtotal' => 'nullable|numeric',
                'apply_to_future_orders' => 'nullable|boolean',
                'expiration_date' => 'nullable|date_format:Y-m-d',
                'status' => 'nullable|string',
            ]);

            $quote->update($validated);

            Log::info("B2B Quote Updated: ID {$id}");

            return response()->json([
                'success' => true,
                'message' => 'Quote updated successfully.',
                'data' => $quote
            ]);
        } catch (Exception $e) {
            Log::error("Error updating quote ID {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update quote.'
            ], 500);
        }
    }

    /**
     * Send quote back to customer (Approve / Sent status).
     */
    public function send($id): JsonResponse
    {
        try {
            $quote = B2BQuote::findOrFail($id);
            $quote->update(['status' => 'Sent']);

            Log::info("B2B Quote Sent: ID {$id}");

            return response()->json([
                'success' => true,
                'message' => 'Quote has been sent to customer.',
                'data' => $quote
            ]);
        } catch (Exception $e) {
            Log::error("Error sending quote ID {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send quote.'
            ], 500);
        }
    }
}
