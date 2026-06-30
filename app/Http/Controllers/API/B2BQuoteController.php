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

            $oldStatus = $quote->status;
            $quote->update($validated);

            Log::info("B2B Quote Updated: ID {$id}");

            if (isset($validated['status']) && $validated['status'] === 'Approved' && $oldStatus !== 'Approved') {
                $this->createShopifyDraftOrder($quote);
            }

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

        // 2. Build line items using custom item inputs to avoid variant ID mismatch issues
        $lineItems = [
            [
                'title' => $quote->product_name,
                'originalUnitPrice' => (string)$quote->quoted_price,
                'quantity' => (int)$quote->quantity
            ]
        ];

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
     * Helper to make GraphQL requests to Shopify Admin API
     */
    private function queryShopifyGraphQL(string $query, array $variables = [], ?string $shopDomain = null): array
    {
        $accessToken = $this->getAccessToken($shopDomain);
        $apiVersion = config('shopify.api_version', '2026-04');

        if (!$shopDomain || !$accessToken) {
            Log::warning('Shopify shop domain or access token not configured. Skipping live API call.', [
                'shopDomain' => $shopDomain,
                'hasToken' => !empty($accessToken)
            ]);
            return ['success' => false, 'error' => 'Shopify API credentials not configured.'];
        }

        $url = "https://{$shopDomain}/admin/api/{$apiVersion}/graphql.json";

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'X-Shopify-Access-Token' => $accessToken,
                'Content-Type' => 'application/json',
            ])->post($url, [
                'query' => $query,
                'variables' => $variables,
            ]);

            if ($response->failed()) {
                return ['success' => false, 'error' => 'API Request Failed: ' . $response->body()];
            }

            $data = $response->json();
            if (isset($data['errors'])) {
                return ['success' => false, 'errors' => $data['errors']];
            }

            return ['success' => true, 'data' => $data['data']];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get the active access token for the given shop domain.
     */
    private function getAccessToken(?string $shopDomain): ?string
    {
        if (!$shopDomain) {
            return config('shopify.access_token');
        }

        $shop = \App\Models\ShopifyShop::where('shop_domain', $shopDomain)->first();
        return $shop ? $shop->access_token : config('shopify.access_token');
    }
}
