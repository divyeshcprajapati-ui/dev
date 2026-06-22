<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\B2BRegisterRequest;
use App\Models\B2BApplication;
use App\Models\B2BSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Models\B2BNotificationSetting;
use Exception;
use Illuminate\Http\Request;

class B2BRegistrationController extends Controller
{
    /**
     * Fetch all B2B registration application requests.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $limit = $request->query('limit', 20);
            $status = $request->query('status');

            $query = B2BApplication::orderBy('created_at', 'desc');

            if ($status && $status !== 'all') {
                if (strtolower($status) === 'failed') {
                    $query->whereIn('status', ['Rejected', 'Failed']);
                } else {
                    $query->where('status', ucfirst($status));
                }
            }

            $applications = $query->paginate($limit);

            return response()->json([
                'success' => true,
                'data' => $applications->items(),
                'meta' => [
                    'current_page' => $applications->currentPage(),
                    'last_page' => $applications->lastPage(),
                    'per_page' => $applications->perPage(),
                    'total' => $applications->total(),
                    'has_more' => $applications->hasMorePages()
                ]
            ]);
        } catch (Exception $e) {
            Log::error('B2B index query error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve applications.'
            ], 500);
        }
    }

    /**
     * Retrieve a single B2B application by ID.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id): JsonResponse
    {
        try {
            $application = B2BApplication::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $application
            ]);
        } catch (Exception $e) {
            Log::error("Error fetching B2B Application ID {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve application details.'
            ], 404);
        }
    }

    /**
     * Handle incoming B2B registration application requests.
     *
     * @param  \App\Http\Requests\B2BRegisterRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(B2BRegisterRequest $request): JsonResponse
    {
        try {
            $validatedData = $request->validated();
            Log::info('B2B Register Request received', [
                'all' => $request->all(),
                'validated' => $validatedData
            ]);

            // Document upload handler
            $filePath = null;
            if ($request->hasFile('businessDocument')) {
                $file = $request->file('businessDocument');
                // Store in secure 'b2b_documents' directory (private store)
                $filePath = $file->store('b2b_documents', 'local');
            }

            // Parse metafields if it's sent as a string (JSON) or array
            $metafields = null;
            Log::info('Raw metafields input: ' . (isset($validatedData['metafields']) ? gettype($validatedData['metafields']) : 'not set'), [
                'metafields_raw' => $validatedData['metafields'] ?? null
            ]);

            if (isset($validatedData['metafields'])) {
                if (is_array($validatedData['metafields'])) {
                    $metafields = $validatedData['metafields'];
                } elseif (is_string($validatedData['metafields'])) {
                    $metafields = json_decode($validatedData['metafields'], true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        Log::error('Metafields JSON decode error: ' . json_last_error_msg());
                    }
                }
            }

            Log::info('Parsed metafields: ', ['metafields' => $metafields]);

            // Save B2B Application Data to database
            $application = B2BApplication::create([
                'first_name' => $validatedData['firstName'],
                'last_name' => $validatedData['lastName'],
                'email' => $validatedData['email'],
                'company_name' => $validatedData['companyName'],
                'website' => $validatedData['website'] ?? null,
                'tax_id' => $validatedData['taxId'] ?? null,
                'phone' => $validatedData['phone'] ?? null,
                'address' => $validatedData['address'],
                'city' => $validatedData['city'],
                'zip' => $validatedData['zip'],
                'country' => $validatedData['country'],
                'business_document_path' => $filePath,
                'notes' => $validatedData['notes'] ?? null,
                'status' => 'Pending',
                'metafields' => $metafields,
            ]);

            Log::info('New B2B registration application saved', ['application_id' => $application->id]);

            return response()->json([
                'success' => true,
                'message' => 'Your B2B application has been submitted successfully and is under review.',
                'data' => [
                    'id' => $application->id,
                    'companyName' => $application->company_name,
                    'email' => $application->email,
                    'status' => $application->status,
                ]
            ], 201);

        } catch (Exception $e) {
            Log::error('B2B registration error: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->except(['businessDocument'])
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your application. Please try again later.'
            ], 500);
        }
    }

    /**
     * Approve a B2B application.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    /**
     * Approve a B2B application.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function approve($id): JsonResponse
    {
        try {
            $application = B2BApplication::findOrFail($id);

            // Prepare B2B Company Creation Payload
            $companyName = $application->company_name;
            $firstName = $application->first_name;
            $lastName = $application->last_name;
            $email = $application->email;
            $phone = $application->phone;
            $address = $application->address;
            $city = $application->city;
            $zip = $application->zip;
            $country = $application->country;
            $province = $application->province;

            $companyCreateInput = [
                'company' => [
                    'name' => $companyName,
                ],
                'companyContact' => [
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'email' => $email,
                ],
                'companyLocation' => [
                    'name' => 'Main Office',
                    'shippingAddress' => [
                        'address1' => $address,
                        'city' => $city,
                        'zip' => $zip,
                        'countryCode' => $this->getCountryCodeByName($country),
                    ]
                ]
            ];

            if ($phone) {
                $companyCreateInput['companyContact']['phone'] = $phone;
            }
            
            $provinceCode = $this->getProvinceCodeByName($province, $country);
            if ($provinceCode) {
                $companyCreateInput['companyLocation']['shippingAddress']['provinceCode'] = $provinceCode;
            }

            // GraphQL Mutation for Company, Contact and Location Creation
            $companyCreateMutation = '
            mutation companyCreate($input: CompanyCreateInput!) {
              companyCreate(input: $input) {
                company {
                  id
                  locations(first: 1) {
                    edges {
                      node {
                        id
                      }
                    }
                  }
                  contacts(first: 1) {
                    edges {
                      node {
                        id
                      }
                    }
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }';

            Log::info("Attempting B2B Company Creation in Shopify for application ID: {$id}");
            $res = $this->queryShopifyGraphQL($companyCreateMutation, ['input' => $companyCreateInput]);

            $shopifyData = null;
            if ($res['success']) {
                $createData = $res['data']['companyCreate'];
                if (!empty($createData['userErrors'])) {
                    Log::warning('Shopify B2B Company creation returned validation errors', ['errors' => $createData['userErrors']]);
                } else {
                    $company = $createData['company'];
                    $companyId = $company['id'];
                    $locationId = $company['locations']['edges'][0]['node']['id'] ?? null;
                    $contactId = $company['contacts']['edges'][0]['node']['id'] ?? null;

                    Log::info("Shopify B2B Company created successfully", [
                        'company_id' => $companyId,
                        'location_id' => $locationId,
                        'contact_id' => $contactId
                    ]);

                    // Assign Contact Role as "Location admin"
                    if ($companyId && $locationId && $contactId) {
                        $this->assignLocationAdminRole($companyId, $contactId, $locationId);
                    }

                    $shopifyData = [
                        'shopify_company_id' => $companyId,
                        'shopify_location_id' => $locationId,
                        'shopify_contact_id' => $contactId
                    ];
                }
            }

            // Update local lead status
            $application->update(['status' => 'Approved']);

            Log::info("B2B Application Approved: ID {$id}");

            return response()->json([
                'success' => true,
                'message' => 'Application has been approved successfully.',
                'data' => $application,
                'shopify' => $shopifyData
            ]);
        } catch (Exception $e) {
            Log::error("Error approving B2B Application ID {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve application.'
            ], 500);
        }
    }

    /**
     * Helper to make GraphQL requests to Shopify Admin API
     */
    private function queryShopifyGraphQL(string $query, array $variables = []): array
    {
        $shopDomain = config('shopify.shop_domain');
        $accessToken = config('shopify.access_token');
        $apiVersion = config('shopify.api_version', '2026-04');

        if (!$shopDomain || !$accessToken) {
            Log::warning('Shopify shop domain or access token not configured. Skipping live API call.');
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
                Log::error('Shopify GraphQL API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return ['success' => false, 'error' => 'API Request Failed: ' . $response->body()];
            }

            $data = $response->json();
            if (isset($data['errors'])) {
                Log::error('Shopify GraphQL API returned errors', ['errors' => $data['errors']]);
                return ['success' => false, 'errors' => $data['errors']];
            }

            return ['success' => true, 'data' => $data['data']];
        } catch (Exception $e) {
            Log::error('Shopify GraphQL API communication error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Assign Location Admin role to the B2B contact
     */
    private function assignLocationAdminRole(string $companyId, string $contactId, string $locationId): void
    {
        // 1. Fetch available contact roles
        $rolesQuery = '
        query getCompanyRoles($companyId: ID!) {
          node(id: $companyId) {
            ... on Company {
              contactRoles(first: 10) {
                nodes {
                  id
                  name
                }
              }
            }
          }
        }';

        $res = $this->queryShopifyGraphQL($rolesQuery, ['companyId' => $companyId]);
        if (!$res['success']) {
            Log::error('Failed to fetch contact roles from Shopify');
            return;
        }

        $roles = $res['data']['node']['contactRoles']['nodes'] ?? [];
        $adminRoleId = null;
        foreach ($roles as $role) {
            if (strtolower($role['name']) === 'location admin') {
                $adminRoleId = $role['id'];
                break;
            }
        }

        if (!$adminRoleId) {
            Log::warning('Location admin role not found in Shopify roles list');
            return;
        }

        // 2. Assign the role
        $assignMutation = '
        mutation companyContactAssignRole($companyContactId: ID!, $companyContactRoleId: ID!, $companyLocationId: ID!) {
          companyContactAssignRole(
            companyContactId: $companyContactId, 
            companyContactRoleId: $companyContactRoleId, 
            companyLocationId: $companyLocationId
          ) {
            companyContactRoleAssignment {
              id
              role {
                name
              }
            }
            userErrors {
              field
              message
            }
          }
        }';

        $assignRes = $this->queryShopifyGraphQL($assignMutation, [
            'companyContactId' => $contactId,
            'companyContactRoleId' => $adminRoleId,
            'companyLocationId' => $locationId
        ]);

        if ($assignRes['success']) {
            $assignData = $assignRes['data']['companyContactAssignRole'];
            if (!empty($assignData['userErrors'])) {
                Log::error('Failed to assign Location admin role', ['errors' => $assignData['userErrors']]);
            } else {
                Log::info('Successfully assigned Location admin role to contact');
            }
        }
    }

    private function getCountryCodeByName(?string $name): string
    {
        if (!$name) return 'US';
        $name = strtolower(trim($name));
        $map = [
            'united states' => 'US',
            'united states of america' => 'US',
            'us' => 'US',
            'canada' => 'CA',
            'ca' => 'CA',
            'india' => 'IN',
            'in' => 'IN',
            'united kingdom' => 'GB',
            'uk' => 'GB',
            'gb' => 'GB'
        ];
        return $map[$name] ?? strtoupper(substr($name, 0, 2));
    }

    private function getProvinceCodeByName(?string $province, ?string $country): ?string
    {
        if (!$province) return null;
        $province = strtolower(trim($province));
        $country = strtolower(trim($country ?? ''));

        if ($country === 'united states' || $country === 'us' || $country === 'united states of america') {
            $states = [
                'alabama' => 'AL', 'alaska' => 'AK', 'arizona' => 'AZ', 'arkansas' => 'AR', 'california' => 'CA',
                'colorado' => 'CO', 'connecticut' => 'CT', 'delaware' => 'DE', 'florida' => 'FL', 'georgia' => 'GA',
                'hawaii' => 'HI', 'idaho' => 'ID', 'illinois' => 'IL', 'indiana' => 'IN', 'iowa' => 'IA',
                'kansas' => 'KS', 'kentucky' => 'KY', 'louisiana' => 'LA', 'maine' => 'ME', 'maryland' => 'MD',
                'massachusetts' => 'MA', 'michigan' => 'MI', 'minnesota' => 'MN', 'mississippi' => 'MS', 'missouri' => 'MO',
                'montana' => 'MT', 'nebraska' => 'NE', 'nevada' => 'NV', 'new hampshire' => 'NH', 'new jersey' => 'NJ',
                'new mexico' => 'NM', 'new york' => 'NY', 'north carolina' => 'NC', 'north dakota' => 'ND', 'ohio' => 'OH',
                'oklahoma' => 'OK', 'oregon' => 'OR', 'pennsylvania' => 'PA', 'rhode island' => 'RI', 'south carolina' => 'SC',
                'south dakota' => 'SD', 'tennessee' => 'TN', 'texas' => 'TX', 'utah' => 'UT', 'vermont' => 'VT',
                'virginia' => 'VA', 'washington' => 'WA', 'west virginia' => 'WV', 'wisconsin' => 'WI', 'wyoming' => 'WY'
            ];
            return $states[$province] ?? strtoupper(substr($province, 0, 2));
        }

        if ($country === 'canada' || $country === 'ca') {
            $provinces = [
                'ontario' => 'ON', 'quebec' => 'QC', 'nova scotia' => 'NS', 'new brunswick' => 'NB',
                'manitoba' => 'MB', 'british columbia' => 'BC', 'prince edward island' => 'PE', 'saskatchewan' => 'SK',
                'alberta' => 'AB', 'newfoundland and labrador' => 'NL', 'newfoundland' => 'NL', 'labrador' => 'NL'
            ];
            return $provinces[$province] ?? strtoupper(substr($province, 0, 2));
        }

        return strtoupper(substr($province, 0, 2));
    }

    /**
     * Reject a B2B application.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function reject($id): JsonResponse
    {
        try {
            $application = B2BApplication::findOrFail($id);
            $application->update(['status' => 'Rejected']);

            Log::info("B2B Application Rejected: ID {$id}");

            return response()->json([
                'success' => true,
                'message' => 'Application has been rejected.',
                'data' => $application
            ]);
        } catch (Exception $e) {
            Log::error("Error rejecting B2B Application ID {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject application.'
            ], 500);
        }
    }

    /**
     * Retrieve all B2B subscription module pricing from database.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSubscriptions(): JsonResponse
    {
        try {
            $subscriptions = B2BSubscription::all();
            return response()->json([
                'success' => true,
                'data' => $subscriptions
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching B2B subscriptions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subscription pricing.'
            ], 500);
        }
    }

    /**
     * Retrieve all notification settings.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getNotificationSettings(): JsonResponse
    {
        try {
            $settings = B2BNotificationSetting::all();
            return response()->json([
                'success' => true,
                'data' => $settings
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching notification settings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve notification settings.'
            ], 500);
        }
    }

    /**
     * Update a specific notification setting.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateNotificationSetting(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'setting_key' => 'required|string|exists:b2b_notification_settings,setting_key',
                'is_enabled' => 'required|boolean',
            ]);

            $setting = B2BNotificationSetting::where('setting_key', $validated['setting_key'])->firstOrFail();
            $setting->update([
                'is_enabled' => $validated['is_enabled']
            ]);

            Log::info("Notification Setting Updated: {$validated['setting_key']} to {$validated['is_enabled']}");

            return response()->json([
                'success' => true,
                'message' => 'Notification setting updated successfully.',
                'data' => $setting
            ]);
        } catch (Exception $e) {
            Log::error('Error updating notification setting: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update notification setting.'
            ], 500);
        }
    }

    /**
     * Get registration form steps config
     */
    public function getFormConfig(): JsonResponse
    {
        try {
            $setting = \App\Models\B2BQuoteSetting::where('setting_key', 'b2b_form_steps')->first();
            $steps = null;
            if ($setting && $setting->setting_value) {
                $steps = json_decode($setting->setting_value, true);
            }

            return response()->json([
                'success' => true,
                'data' => $steps
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching form config: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve form configuration.'
            ], 500);
        }
    }

    /**
     * Update registration form steps config
     */
    public function updateFormConfig(Request $request): JsonResponse
    {
        try {
            $steps = $request->input('steps');
            $val = is_array($steps) ? json_encode($steps) : $steps;

            \App\Models\B2BQuoteSetting::updateOrCreate(
                ['setting_key' => 'b2b_form_steps'],
                ['setting_value' => $val]
            );

            return response()->json([
                'success' => true,
                'message' => 'Form configuration saved successfully.'
            ]);
        } catch (Exception $e) {
            Log::error('Error saving form config: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save form configuration.'
            ], 500);
        }
    }
}
