<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\B2BQuote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Exception;
use App\Traits\HasShopifyApi;

class B2BQuoteController extends Controller
{
    use HasShopifyApi;
    /**
     * Get all quotes.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $status = $request->query('status');
            $email = $request->query('email');
            $shop = $request->query('shop');
            
            $query = B2BQuote::with('items')->orderBy('created_at', 'desc');

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
    public function show(Request $request, $id): JsonResponse
    {
        try {
            $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
            $query = B2BQuote::with('items');
            if ($shop) {
                $query->where('shop_domain', $shop);
            }
            $quote = $query->findOrFail($id);
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
                'product_name' => 'required_without:items|string',
                'original_price' => 'required_without:items|numeric',
                'quoted_price' => 'required_without:items|numeric',
                'quantity' => 'required_without:items|integer|min:1',
                'subtotal' => 'required_without:items|numeric',
                'customer_name' => 'required|string',
                'customer_email' => 'required|email',
                'company_name' => 'required|string',
                'company_location' => 'required|string',
                'shipping_address' => 'required|string',
                'billing_address' => 'nullable|string',
                'expiration_date' => 'nullable|date',
                'image_url' => 'nullable|string',
                
                // Multi-item quotes support
                'items' => 'nullable|array',
                'items.*.product_name' => 'required_with:items|string',
                'items.*.original_price' => 'required_with:items|numeric',
                'items.*.quoted_price' => 'required_with:items|numeric',
                'items.*.quantity' => 'required_with:items|integer|min:1',
                'items.*.image_url' => 'nullable|string',
            ]);

            // Calculate overall subtotal and prepare items data
            $subtotal = 0;
            $itemsData = [];

            if ($request->has('items') && is_array($request->input('items'))) {
                foreach ($request->input('items') as $item) {
                    $itemSubtotal = $item['quoted_price'] * $item['quantity'];
                    $subtotal += $itemSubtotal;
                    $itemsData[] = [
                        'product_name' => $item['product_name'],
                        'original_price' => $item['original_price'],
                        'quoted_price' => $item['quoted_price'],
                        'quantity' => $item['quantity'],
                        'subtotal' => $itemSubtotal,
                        'image_url' => $item['image_url'] ?? null
                    ];
                }
            } else {
                $subtotal = $validated['subtotal'];
                $itemsData[] = [
                    'product_name' => $validated['product_name'],
                    'original_price' => $validated['original_price'],
                    'quoted_price' => $validated['quoted_price'],
                    'quantity' => $validated['quantity'],
                    'subtotal' => $validated['subtotal'],
                    'image_url' => $validated['image_url'] ?? null
                ];
            }

            // Create parent B2B Quote
            $nextId = (B2BQuote::max('id') ?? 0) + 1;
            
            // Format parent fields for backwards compatibility with single product UI
            $firstItem = $itemsData[0];
            $prodSummary = count($itemsData) === 1 
                ? $firstItem['product_name'] 
                : $firstItem['product_name'] . ' (+ ' . (count($itemsData) - 1) . ' items)';

            $quoteData = [
                'shop_domain' => $validated['shop_domain'] ?? null,
                'quote_number' => '#' . $nextId,
                'status' => 'Pending',
                'product_name' => $prodSummary,
                'original_price' => count($itemsData) === 1 ? $firstItem['original_price'] : 0,
                'quoted_price' => count($itemsData) === 1 ? $firstItem['quoted_price'] : 0,
                'quantity' => count($itemsData) === 1 ? $firstItem['quantity'] : count($itemsData),
                'subtotal' => $subtotal,
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'],
                'company_name' => $validated['company_name'],
                'company_location' => $validated['company_location'],
                'shipping_address' => $validated['shipping_address'],
                'billing_address' => $validated['billing_address'] ?? null,
                'expiration_date' => $validated['expiration_date'] ?? null,
                'image_url' => $firstItem['image_url'] ?? null,
            ];

            $quote = B2BQuote::create($quoteData);

            // Save relationship items
            foreach ($itemsData as $item) {
                $quote->items()->create($item);
            }

            Log::info('New B2B quote submitted', ['quote_id' => $quote->id]);

            // Trigger Shopify Flow Trigger event
            try {
                $shopDomain = $validated['shop_domain'] ?? null;
                if ($shopDomain) {
                    $this->triggerFlowQuoteSubmitted($quote, $shopDomain);
                }
            } catch (Exception $flowEx) {
                Log::error('Shopify Flow quote trigger execution failed: ' . $flowEx->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Quote request submitted successfully.',
                'data' => $quote->load('items')
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
            $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
            $query = B2BQuote::query();
            if ($shop) {
                $query->where('shop_domain', $shop);
            }
            $quote = $query->findOrFail($id);

            $validated = $request->validate([
                'quoted_price' => 'nullable|numeric',
                'quantity' => 'nullable|integer|min:1',
                'subtotal' => 'nullable|numeric',
                'apply_to_future_orders' => 'nullable|boolean',
                'expiration_date' => 'nullable|date_format:Y-m-d',
                'status' => 'nullable|string',
                
                // Multi-item updates support
                'items' => 'nullable|array',
                'items.*.id' => 'required_with:items',
                'items.*.quoted_price' => 'required_with:items|numeric',
                'items.*.quantity' => 'required_with:items|integer|min:1',
            ]);

            $oldStatus = $quote->status;
            
            // If items are provided, update each child item and recalculate totals
            if ($request->has('items') && is_array($request->input('items'))) {
                $totalQty = 0;
                $totalSubtotal = 0;
                
                foreach ($request->input('items') as $itemData) {
                    $item = \App\Models\B2BQuoteItem::find($itemData['id']);
                    if ($item && $item->b2b_quote_id == $quote->id) {
                        $itemSubtotal = $itemData['quoted_price'] * $itemData['quantity'];
                        $item->update([
                            'quoted_price' => $itemData['quoted_price'],
                            'quantity' => $itemData['quantity'],
                            'subtotal' => $itemSubtotal
                        ]);
                        $totalQty += $itemData['quantity'];
                        $totalSubtotal += $itemSubtotal;
                    }
                }
                
                // Update parent fields with new sums
                $quote->update([
                    'quantity' => $totalQty,
                    'subtotal' => $totalSubtotal,
                    'apply_to_future_orders' => $validated['apply_to_future_orders'] ?? $quote->apply_to_future_orders,
                    'expiration_date' => $validated['expiration_date'] ?? $quote->expiration_date,
                    'status' => $validated['status'] ?? $quote->status
                ]);
            } else {
                // Backward compatibility for single product quotes
                $quote->update($validated);
            }

            Log::info("B2B Quote Updated: ID {$id}");

            if (isset($validated['status']) && $validated['status'] === 'Approved' && $oldStatus !== 'Approved') {
                $this->createShopifyDraftOrder($quote);
            }

            return response()->json([
                'success' => true,
                'message' => 'Quote updated successfully.',
                'data' => $quote->load('items')
            ]);
        } catch (Exception $e) {
            Log::error("Error updating quote ID {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update quote. ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send quote back to customer (Approve / Sent status).
     */
    public function send(Request $request, $id): JsonResponse
    {
        try {
            $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
            $query = B2BQuote::query();
            if ($shop) {
                $query->where('shop_domain', $shop);
            }
            $quote = $query->findOrFail($id);
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

    /**
     * Create Shopify Draft Order for the approved B2B Quote
     */
    private function createShopifyDraftOrder(B2BQuote $quote): void
    {
        $shopDomain = $quote->shop_domain ?? config('shopify.shop_domain');
        if (!$shopDomain) {
            Log::warning('No shop domain for quote, cannot create draft order');
            return;
        }

        // 1. Find Customer ID and Company Location ID by querying Shopify
        $customerId = null;
        $companyLocationId = null;

        // Query customer by email
        $customerQuery = '
        query findCustomer($query: String!) {
          customers(first: 1, query: $query) {
            edges {
              node {
                id
                email
              }
            }
          }
        }';

        $customerRes = $this->queryShopifyGraphQL($customerQuery, ['query' => 'email:' . $quote->customer_email], $shopDomain);
        if ($customerRes['success'] && !empty($customerRes['data']['customers']['edges'])) {
            $customerId = $customerRes['data']['customers']['edges'][0]['node']['id'];

            // Find B2B Location
            $b2bQuery = '
            query findCompanyContact($customerId: ID!) {
              customer(id: $customerId) {
                companyContacts(first: 5) {
                  edges {
                    node {
                      company {
                        locations(first: 5) {
                          edges {
                            node {
                              id
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }';

            $b2bRes = $this->queryShopifyGraphQL($b2bQuery, ['customerId' => $customerId], $shopDomain);
            if ($b2bRes['success'] && !empty($b2bRes['data']['customer']['companyContacts']['edges'])) {
                $contacts = $b2bRes['data']['customer']['companyContacts']['edges'];
                foreach ($contacts as $contactEdge) {
                    $locations = $contactEdge['node']['company']['locations']['edges'] ?? [];
                    if (!empty($locations)) {
                        $companyLocationId = $locations[0]['node']['id'];
                        break;
                    }
                }
            }
        }

        // 2. Build line items
        $lineItems = [];
        if (!$quote->relationLoaded('items')) {
            $quote->load('items');
        }

        foreach ($quote->items as $item) {
            $lineItems[] = [
                'title' => $item->product_name,
                'originalUnitPrice' => (string)$item->quoted_price,
                'quantity' => (int)$item->quantity
            ];
        }

        if (empty($lineItems)) {
            $lineItems[] = [
                'title' => $quote->product_name,
                'originalUnitPrice' => (string)$quote->quoted_price,
                'quantity' => (int)$quote->quantity
            ];
        }

        // 3. Draft Order Input
        $input = [
            'lineItems' => $lineItems,
            'email' => $quote->customer_email
        ];

        if ($customerId) {
            $input['customerId'] = $customerId;
        }

        if ($companyLocationId) {
            $input['purchasingEntity'] = [
                'companyLocationId' => $companyLocationId
            ];
        }

        $draftOrderMutation = '
        mutation draftOrderCreate($input: DraftOrderInput!) {
          draftOrderCreate(input: $input) {
            draftOrder {
              id
              invoiceUrl
            }
            userErrors {
              field
              message
            }
          }
        }';

        Log::info("Attempting draft order creation for quote ID: {$quote->id}");
        $res = $this->queryShopifyGraphQL($draftOrderMutation, ['input' => $input], $shopDomain);
        if ($res['success']) {
            $draftOrderData = $res['data']['draftOrderCreate'] ?? null;
            if ($draftOrderData && empty($draftOrderData['userErrors'])) {
                $draftOrderId = $draftOrderData['draftOrder']['id'];
                Log::info("Shopify Draft Order created successfully: {$draftOrderId}");
            } else {
                $errors = json_encode($draftOrderData['userErrors'] ?? 'Unknown Shopify error');
                Log::error("Shopify Draft Order creation failed: {$errors}");
            }
        } else {
            Log::error("GraphQL draft order mutation failed");
        }
    }





    /**
     * Trigger Shopify Flow event for B2b Quote Form Submited
     */
    private function triggerFlowQuoteSubmitted($quote, string $shopDomain): void
    {
        $mutation = '
        mutation flowTriggerReceive($handle: String!, $payload: JSON!) {
          flowTriggerReceive(handle: $handle, payload: $payload) {
            userErrors {
              field
              message
            }
          }
        }';

        $customerId = null;

        // 1. First, check if the request explicitly passed a shopify_customer_id GID
        if (request()->has('shopify_customer_id') && !empty(request()->input('shopify_customer_id'))) {
            $customerId = request()->input('shopify_customer_id');
        }

        // 2. Next, check if there is a local B2B application with this email to get the customer GID
        if (!$customerId && !empty($quote->customer_email)) {
            $application = \App\Models\B2BApplication::where('shop_domain', $shopDomain)
                ->where('email', $quote->customer_email)
                ->whereNotNull('shopify_customer_id')
                ->where('shopify_customer_id', '!=', '')
                ->first();
            if ($application) {
                $customerId = $application->shopify_customer_id;
            }
        }

        // 3. Next, try to search for the customer dynamically on Shopify by email
        if (!$customerId && !empty($quote->customer_email)) {
            $customerId = $this->getShopifyCustomerIdByEmail($quote->customer_email, $shopDomain);
        }

        // 4. Fallback: Query Shopify for first customer GID
        if (!$customerId) {
            $customerId = $this->getFirstShopifyCustomerId($shopDomain);
        }

        // 5. Fallback: Find any approved customer ID locally
        if (!$customerId) {
            $existing = \App\Models\B2BApplication::where('shop_domain', $shopDomain)
                ->whereNotNull('shopify_customer_id')
                ->where('shopify_customer_id', '!=', '')
                ->first();
            if ($existing) {
                $customerId = $existing->shopify_customer_id;
            }
        }

        // 6. Fallback: Use dummy GID
        if (!$customerId) {
            $customerId = "gid://shopify/Customer/1";
        }

        $payload = [
            'Your field key' => 'New B2B Quote submitted by: ' . $quote->customer_name . ' (' . $quote->company_name . ') - Total: $' . number_format($quote->subtotal, 2)
        ];

        Log::info("Triggering Shopify Flow for b2b-quote-form-submited", [
            'shop' => $shopDomain,
            'payload' => $payload
        ]);

        $res = $this->queryShopifyGraphQL($mutation, [
            'handle' => 'b2b-quote-form-submited',
            'payload' => $payload
        ], $shopDomain);

        if (!$res['success']) {
            Log::error("Failed to trigger Shopify Flow b2b-quote-form-submited: " . json_encode($res['errors'] ?? $res['error'] ?? 'Unknown error'));
        } else {
            $errors = $res['data']['flowTriggerReceive']['userErrors'] ?? [];
            if (!empty($errors)) {
                Log::error("Shopify Flow b2b-quote-form-submited returned userErrors: " . json_encode($errors));
            } else {
                Log::info("Successfully triggered Shopify Flow b2b-quote-form-submited");
            }
        }
    }


}
