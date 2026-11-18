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
use App\Jobs\TriggerB2BRegistrationFlow;
use App\Services\B2BNotificationService;
use Exception;
use Illuminate\Http\Request;
use App\Traits\HasShopifyApi;

class B2BRegistrationController extends Controller
{
    use HasShopifyApi;
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
            $shopDomain = $this->resolveShopDomain($request);

            $query = B2BApplication::where('shop_domain', $shopDomain)->orderBy('created_at', 'desc');

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
    public function show(Request $request, $id): JsonResponse
    {
        try {
            $shopDomain = $this->resolveShopDomain($request);
            if (!$shopDomain) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shop domain is required.'
                ], 400);
            }

            $application = B2BApplication::where('shop_domain', $shopDomain)
                ->where('id', $id)
                ->firstOrFail();

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
     * Securely stream/download the uploaded business verification document for a B2B application.
     */
    public function downloadDocument(Request $request, $id)
    {
        try {
            $shopDomain = $this->resolveShopDomain($request);
            if (!$shopDomain) {
                return response()->json(['success' => false, 'message' => 'Shop domain is required.'], 400);
            }

            $application = B2BApplication::where('shop_domain', $shopDomain)
                ->where('id', $id)
                ->firstOrFail();

            if (!$application->business_document_path || !Storage::disk('local')->exists($application->business_document_path)) {
                return response()->json(['success' => false, 'message' => 'Business document not found.'], 404);
            }

            return Storage::disk('local')->download(
                $application->business_document_path,
                basename($application->business_document_path)
            );
        } catch (Exception $e) {
            Log::error("Error downloading document for B2B Application ID {$id}: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve document.'], 404);
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

            $shopDomain = $this->resolveShopDomain($request);

            // Document upload handler
            $filePath = null;
            if ($request->hasFile('businessDocument')) {
                $file = $request->file('businessDocument');
                // Store in secure 'b2b_documents' directory (private store)
                $filePath = $file->store('b2b_documents', 'local');
            }

            // Parse metafields if it's sent as a string (JSON) or array
            // IMPORTANT: Store empty array [] for "{}" — do NOT collapse to null.
            // An empty metafields payload is valid; null means "not provided at all".
            $metafields = null;
            $rawMetafields = $request->input('metafields');
            Log::info('Raw metafields input: ' . (isset($rawMetafields) ? gettype($rawMetafields) : 'not set'), [
                'metafields_raw' => $rawMetafields
            ]);

            if (isset($rawMetafields)) {
                if (is_array($rawMetafields)) {
                    // Already decoded array (e.g. sent as application/json)
                    $metafields = $rawMetafields; // keep as-is, even if empty []
                } elseif (is_string($rawMetafields) && $rawMetafields !== '') {
                    $decoded = json_decode($rawMetafields, true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        Log::error('Metafields JSON decode error: ' . json_last_error_msg());
                        // Leave $metafields as null on parse failure
                    } else {
                        // Preserve decoded value even when it is an empty array [].
                        // json_decode("{}") returns [] which is falsy in PHP — this was the bug.
                        $metafields = $decoded;
                    }
                }
            }

            $metafieldCount = is_array($metafields) ? count($metafields) : 0;
            Log::info('Parsed metafields: ' . ($metafields !== null ? "{$metafieldCount} entries" : 'not provided'), ['metafields' => $metafields]);

            // Save B2B Application Data to database
            $application = B2BApplication::create([
                'shop_domain' => $shopDomain,
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
                'shopify_customer_id' => $request->input('shopify_customer_id'),
            ]);

            Log::info('New B2B registration application saved', ['application_id' => $application->id]);

            // Send staff email notification if enabled
            if ($shopDomain) {
                $notifier = app(B2BNotificationService::class);
                $staffEmail = $notifier->resolveStaffEmail($shopDomain);
                $notifier->sendIfEnabled(
                    $shopDomain,
                    'b2b_submission_received',
                    $staffEmail,
                    "New B2B Application: {$application->company_name}",
                    'New B2B Registration Application Received',
                    [
                        "Company: {$application->company_name}",
                        "Applicant: {$application->first_name} {$application->last_name} ({$application->email})",
                        "Location: {$application->city}, {$application->country}",
                        'Log in to your Shopify Admin to review and approve or reject this application.',
                    ]
                );

                // Dispatch Shopify Flow trigger on Enterprise plan
                $shopRecord = \App\Models\ShopifyShop::where('shop_domain', $shopDomain)->first();
                if ($shopRecord && in_array(strtolower($shopRecord->active_plan ?? 'free'), ['plus', 'enterprise'], true)) {
                    TriggerB2BRegistrationFlow::dispatch($application->id, $shopDomain)->afterResponse();
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Your B2B application has been submitted successfully and is under review.',
                'data'    => [
                    'id'          => $application->id,
                    'companyName' => $application->company_name,
                    'email'       => $application->email,
                    'status'      => $application->status,
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
    public function approve(Request $request, $id): JsonResponse
    {
        try {
            $shopDomain = $this->resolveShopDomain($request);
            if (!$shopDomain) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shop domain is required.'
                ], 400);
            }

            $application = B2BApplication::where('shop_domain', $shopDomain)
                ->where('id', $id)
                ->firstOrFail();

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
                // Sanitize phone number to E.164 format (e.g. +918798765434) by removing non-digits and keeping the '+' prefix
                $cleanPhone = preg_replace('/[^\d+]/', '', $phone);
                if (!str_starts_with($cleanPhone, '+') && str_starts_with($cleanPhone, '91')) {
                    // Fallback to prepend + if missing for common cases
                    $cleanPhone = '+' . $cleanPhone;
                }
                $companyCreateInput['companyContact']['phone'] = $cleanPhone;
            }
            
            $provinceCode = $this->getProvinceCodeByName($province, $country);
            if ($provinceCode) {
                $companyCreateInput['companyLocation']['shippingAddress']['provinceCode'] = $provinceCode;
            }

            // Map and attach B2B application custom metafields
            $companyMetafields = [];
            $contactMetafields = [];

            if ($application->metafields && is_array($application->metafields)) {
                foreach ($application->metafields as $fullKey => $meta) {
                    $parts = explode('.', $fullKey, 2);
                    $namespace = $parts[0] ?? 'custom';
                    $key = $parts[1] ?? $fullKey;
                    
                    $metafieldInput = [
                        'namespace' => $namespace,
                        'key' => $key,
                        'value' => (string)($meta['value'] ?? ''),
                        'type' => $meta['type'] ?? 'single_line_text_field'
                    ];

                    $ownerType = strtolower($meta['owner_type'] ?? '');
                    if ($ownerType === 'company') {
                        $companyMetafields[] = $metafieldInput;
                    } elseif ($ownerType === 'customer' || $ownerType === 'contact') {
                        $contactMetafields[] = $metafieldInput;
                    }
                }
            }

            if (!empty($companyMetafields)) {
                $companyCreateInput['company']['metafields'] = $companyMetafields;
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
                        customer {
                          id
                        }
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
            $res = $this->queryShopifyGraphQL($companyCreateMutation, ['input' => $companyCreateInput], $shopDomain);

            if (!$res['success']) {
                $errorMessage = $res['error'] ?? (isset($res['errors']) ? json_encode($res['errors']) : 'Unknown Shopify error');
                Log::warning("Shopify GraphQL B2B Company creation failed, evaluating standard customer fallback: {$errorMessage}");

                $isB2BUnavailable = str_contains(strtolower($errorMessage), 'shopify plus')
                    || str_contains(strtolower($errorMessage), 'access_denied')
                    || str_contains(strtolower($errorMessage), 'b2b')
                    || str_contains(strtolower($errorMessage), 'companycreate');

                if ($isB2BUnavailable) {
                    return $this->approveAsStandardCustomer($application, $shopDomain, $contactMetafields);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Shopify company creation failed. Please verify store permissions and try again.'
                ], 500);
            }

            $shopifyData = null;
            $createData = $res['data']['companyCreate'] ?? null;
            if (!$createData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid response structure from Shopify'
                ], 500);
            }

            if (!empty($createData['userErrors'])) {
                Log::warning('Shopify B2B Company creation returned validation errors', ['errors' => $createData['userErrors']]);
                $errorsList = collect($createData['userErrors'])->map(fn($e) => $e['message'])->implode(', ');
                return response()->json([
                    'success' => false,
                    'message' => 'Shopify validation errors: ' . $errorsList,
                    'errors' => $createData['userErrors']
                ], 422);
            }

            $company = $createData['company'];
            $companyId = $company['id'];
            $locationId = $company['locations']['edges'][0]['node']['id'] ?? null;
            $contactId = $company['contacts']['edges'][0]['node']['id'] ?? null;
            $customerId = $company['contacts']['edges'][0]['node']['customer']['id'] ?? null;

            // Update customer metafields if present
            if ($customerId && !empty($contactMetafields)) {
                $customerUpdateMutation = '
                mutation customerUpdate($input: CustomerInput!) {
                  customerUpdate(input: $input) {
                    customer {
                      id
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }';

                $customerInput = [
                    'id' => $customerId,
                    'metafields' => $contactMetafields
                ];

                Log::info("Updating customer metafields for customer ID: {$customerId}");
                $customerRes = $this->queryShopifyGraphQL($customerUpdateMutation, ['input' => $customerInput], $shopDomain);
                if (!$customerRes['success']) {
                    Log::error("Failed to update customer metafields: " . json_encode($customerRes['errors'] ?? 'Unknown error'));
                }
            }

            Log::info("Shopify B2B Company created successfully", [
                'company_id' => $companyId,
                'location_id' => $locationId,
                'contact_id' => $contactId,
                'customer_id' => $customerId
            ]);

            // Assign Contact Role as "Location admin"
            if ($companyId && $locationId && $contactId) {
                $this->assignLocationAdminRole($companyId, $contactId, $locationId, $shopDomain);
            }

            $shopifyData = [
                'shopify_company_id' => $companyId,
                'shopify_location_id' => $locationId,
                'shopify_contact_id' => $contactId
            ];

            // Update local lead status and store Shopify IDs
            $application->update([
                'status' => 'Approved',
                'shopify_company_id' => $companyId,
                'shopify_location_id' => $locationId,
                'shopify_contact_id' => $contactId,
                'shopify_customer_id' => $customerId
            ]);

            Log::info("B2B Application Approved: ID {$id}");

            // Notify applicant by email if enabled
            app(B2BNotificationService::class)->sendIfEnabled(
                $shopDomain,
                'b2b_submission_approved',
                $application->email,
                "Your B2B Account Has Been Approved — {$application->company_name}",
                'Welcome! Your Wholesale Account Is Approved',
                [
                    "Hi {$application->first_name},",
                    "Your B2B wholesale application for {$application->company_name} has been approved.",
                    'You can now log in to our store to access wholesale capabilities and request custom quotes.',
                ]
            );

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
     * Fallback approval for non-Plus / standard Shopify plans:
     * Creates or updates a standard Shopify Customer tagged with 'b2b-approved' and company metadata.
     */
    private function approveAsStandardCustomer(B2BApplication $application, string $shopDomain, array $contactMetafields = []): JsonResponse
    {
        $customerId = $this->getShopifyCustomerIdByEmail($application->email, $shopDomain);

        if ($customerId) {
            $mutation = '
            mutation customerUpdate($input: CustomerInput!) {
              customerUpdate(input: $input) {
                customer { id }
                userErrors { field message }
              }
            }';

            $input = [
                'id' => $customerId,
                'firstName' => $application->first_name,
                'lastName' => $application->last_name,
                'tags' => ['b2b-approved', 'wholesale'],
                'note' => "B2B Company: {$application->company_name}" . ($application->tax_id ? " | Tax ID: {$application->tax_id}" : ''),
            ];
            if (!empty($contactMetafields)) {
                $input['metafields'] = $contactMetafields;
            }
            $res = $this->queryShopifyGraphQL($mutation, ['input' => $input], $shopDomain);
            $customerId = $res['data']['customerUpdate']['customer']['id'] ?? $customerId;
        } else {
            $mutation = '
            mutation customerCreate($input: CustomerInput!) {
              customerCreate(input: $input) {
                customer { id }
                userErrors { field message }
              }
            }';

            $input = [
                'firstName' => $application->first_name,
                'lastName' => $application->last_name,
                'email' => $application->email,
                'tags' => ['b2b-approved', 'wholesale'],
                'note' => "B2B Company: {$application->company_name}" . ($application->tax_id ? " | Tax ID: {$application->tax_id}" : ''),
            ];
            if (!empty($contactMetafields)) {
                $input['metafields'] = $contactMetafields;
            }
            $res = $this->queryShopifyGraphQL($mutation, ['input' => $input], $shopDomain);
            $customerId = $res['data']['customerCreate']['customer']['id'] ?? null;
        }

        $application->update([
            'status' => 'Approved',
            'shopify_customer_id' => $customerId ?? $application->shopify_customer_id,
        ]);

        app(B2BNotificationService::class)->sendIfEnabled(
            $shopDomain,
            'b2b_submission_approved',
            $application->email,
            "Your B2B Account Has Been Approved — {$application->company_name}",
            'Welcome! Your Wholesale Account Is Approved',
            [
                "Hi {$application->first_name},",
                "Your B2B wholesale application for {$application->company_name} has been approved.",
                'You can now log in to our store to access wholesale capabilities.',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Application approved as a tagged B2B Customer (standard Shopify plan fallback).',
            'data' => $application,
            'shopify' => ['shopify_customer_id' => $customerId]
        ]);
    }



    /**
     * Assign Location Admin role to the B2B contact
     */
    private function assignLocationAdminRole(string $companyId, string $contactId, string $locationId, string $shopDomain): void
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

        $res = $this->queryShopifyGraphQL($rolesQuery, ['companyId' => $companyId], $shopDomain);
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
        ], $shopDomain);

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
    public function reject(Request $request, $id): JsonResponse
    {
        try {
            $shopDomain = $this->resolveShopDomain($request);
            if (!$shopDomain) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shop domain is required.'
                ], 400);
            }

            $application = B2BApplication::where('shop_domain', $shopDomain)
                ->where('id', $id)
                ->firstOrFail();
            $application->update(['status' => 'Rejected']);

            Log::info("B2B Application Rejected: ID {$id} for shop {$shopDomain}");

            app(B2BNotificationService::class)->sendIfEnabled(
                $shopDomain,
                'b2b_submission_rejected',
                $application->email,
                "Update on Your B2B Application — {$application->company_name}",
                'Update on Your Wholesale Application',
                [
                    "Hi {$application->first_name},",
                    "Thank you for applying for a wholesale account for {$application->company_name}.",
                    'Unfortunately, we were unable to approve your application at this time. Please reply or contact our store support for more details.',
                ]
            );

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
     * Retrieve the active plan and selected modules for a shop.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getShopPlan(Request $request): JsonResponse
    {
        try {
            $shopDomain = $this->resolveShopDomain($request);
            if (!$shopDomain) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shop domain is required.'
                ], 400);
            }

            $shop = \App\Models\ShopifyShop::where('shop_domain', $shopDomain)->first();
            if (!$shop) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shop not found.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'active_plan' => $shop->active_plan ?? 'free',
                    'selected_modules' => $shop->selected_modules ?? [],
                    'billing_cycle' => $shop->billing_cycle ?? 'monthly',
                ]
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching shop plan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve shop plan.'
            ], 500);
        }
    }

    /**
     * Update the active plan and selected modules for a shop.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateShopPlan(Request $request): JsonResponse
    {
        try {
            $shopDomain = $this->resolveShopDomain($request);
            if (!$shopDomain) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shop domain is required.'
                ], 400);
            }

            $shop = \App\Models\ShopifyShop::where('shop_domain', $shopDomain)->first();
            if (!$shop) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shop not found.'
                ], 404);
            }

            $activePlan = $request->input('active_plan', 'free');
            $billingCycle = $request->input('billing_cycle', 'monthly') === 'annually' ? 'annually' : 'monthly';
            $modules = $request->input('selected_modules', []);
            if (!is_array($modules)) {
                $modules = [];
            }

            // Scope selected modules strictly to the chosen plan tier so other tiers' checkboxes don't inflate charges
            $planModulesQuery = \App\Models\B2BSubscription::where('plan_type', $activePlan);
            if (!empty($modules)) {
                $planModulesQuery->whereIn('subscription_key', $modules);
            }
            $matchedModules = $activePlan === 'free'
                ? \App\Models\B2BSubscription::where('plan_type', 'free')->get()
                : $planModulesQuery->get();

            $validModuleKeys = $matchedModules->pluck('subscription_key')->toArray();
            $monthlyTotal = (float) $matchedModules->sum('price');

            if ($activePlan !== 'free' && $monthlyTotal <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please select at least one paid module for this plan.'
                ], 422);
            }

            if ($monthlyTotal > 0) {
                $isAnnual = $billingCycle === 'annually';
                $chargeAmount = $isAnnual ? round($monthlyTotal * 12 * 0.8, 2) : round($monthlyTotal, 2);
                $interval = $isAnnual ? 'ANNUAL' : 'EVERY_30_DAYS';

                $mutation = '
                mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $test: Boolean) {
                  appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test) {
                    appSubscription {
                      id
                    }
                    confirmationUrl
                    userErrors {
                      field
                      message
                    }
                  }
                }';

                $returnUrl = route('shopify.billing.callback', [
                    'shop' => $shopDomain,
                    'plan' => $activePlan,
                    'billing_cycle' => $billingCycle,
                    'modules' => implode(',', $validModuleKeys)
                ]);

                $planDisplayName = $activePlan === 'plus' ? 'Enterprise' : ucfirst($activePlan);
                $variables = [
                    'name' => $planDisplayName . ' Plan (' . ($isAnnual ? 'Annual' : 'Monthly') . ')',
                    'returnUrl' => $returnUrl,
                    'test' => (bool) config('shopify.billing_test', false),
                    'lineItems' => [
                        [
                            'plan' => [
                                'appRecurringPricingDetails' => [
                                    'price' => [
                                        'amount' => $chargeAmount,
                                        'currencyCode' => 'USD'
                                    ],
                                    'interval' => $interval
                                ]
                            ]
                        ]
                    ]
                ];

                $res = $this->queryShopifyGraphQL($mutation, $variables, $shopDomain);
                if ($res['success']) {
                    $errors = $res['data']['appSubscriptionCreate']['userErrors'] ?? [];
                    if (empty($errors)) {
                        $confirmationUrl = $res['data']['appSubscriptionCreate']['confirmationUrl'];
                        return response()->json([
                            'success' => true,
                            'requires_billing' => true,
                            'confirmationUrl' => $confirmationUrl
                        ]);
                    }
                    return response()->json([
                        'success' => false,
                        'message' => 'Shopify Billing error: ' . $errors[0]['message']
                    ], 400);
                }
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to initiate Shopify Billing charge.'
                ], 500);
            }

            // Switching to Free plan: cancel any active recurring Shopify subscription so the merchant is no longer billed
            $this->cancelActiveShopifySubscriptions($shop, $shopDomain);

            $shop->active_plan = 'free';
            $shop->selected_modules = $validModuleKeys;
            $shop->shopify_subscription_id = null;
            $shop->billing_cycle = 'monthly';
            $shop->save();

            return response()->json([
                'success' => true,
                'requires_billing' => false,
                'message' => 'Switched to Free plan successfully.',
                'data' => [
                    'active_plan' => $shop->active_plan,
                    'selected_modules' => $shop->selected_modules,
                    'billing_cycle' => $shop->billing_cycle,
                ]
            ]);
        } catch (Exception $e) {
            Log::error('Error updating shop plan: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update shop plan.'
            ], 500);
        }
    }

    /**
     * Retrieve all notification settings.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getNotificationSettings(Request $request): JsonResponse
    {
        try {
            $shopDomain = $this->resolveShopDomain($request);
            $settings = B2BNotificationSetting::where('shop_domain', $shopDomain)->get();

            if ($settings->isEmpty() && $shopDomain) {
                // Initialize default notification settings for this shop
                $defaultKeys = [
                    ['setting_key' => 'b2b_submission_received', 'is_enabled' => true],
                    ['setting_key' => 'b2b_submission_approved', 'is_enabled' => true],
                    ['setting_key' => 'b2b_submission_rejected', 'is_enabled' => false],
                    ['setting_key' => 'quote_submitted', 'is_enabled' => true],
                    ['setting_key' => 'quote_accepted', 'is_enabled' => true],
                    ['setting_key' => 'quote_rejected', 'is_enabled' => false],
                    ['setting_key' => 'quote_requoted', 'is_enabled' => false],
                    ['setting_key' => 'quote_auto_response', 'is_enabled' => true],
                    ['setting_key' => 'member_added', 'is_enabled' => true],
                    ['setting_key' => 'member_role_updated', 'is_enabled' => false],
                    ['setting_key' => 'list_approved', 'is_enabled' => false],
                    ['setting_key' => 'list_pending_approval', 'is_enabled' => false],
                    ['setting_key' => 'credit_low_alert', 'is_enabled' => false],
                    ['setting_key' => 'credit_assigned', 'is_enabled' => false],
                ];

                foreach ($defaultKeys as $item) {
                    B2BNotificationSetting::create([
                        'shop_domain' => $shopDomain,
                        'setting_key' => $item['setting_key'],
                        'is_enabled' => $item['is_enabled']
                    ]);
                }

                $settings = B2BNotificationSetting::where('shop_domain', $shopDomain)->get();
            }

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
                'setting_key' => 'required|string',
                'is_enabled' => 'required|boolean',
            ]);

            $shopDomain = $this->resolveShopDomain($request);

            $setting = B2BNotificationSetting::where('shop_domain', $shopDomain)
                ->where('setting_key', $validated['setting_key'])
                ->firstOrFail();

            $setting->update([
                'is_enabled' => $validated['is_enabled']
            ]);

            Log::info("Notification Setting Updated for {$shopDomain}: {$validated['setting_key']} to {$validated['is_enabled']}");

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
    public function getFormConfig(Request $request): JsonResponse
    {
        try {
            $shopDomain = $this->resolveShopDomain($request);
            $setting = \App\Models\B2BQuoteSetting::where('shop_domain', $shopDomain)
                ->where('setting_key', 'b2b_form_steps')
                ->first();
            
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
            $shopDomain = $this->resolveShopDomain($request);
            $steps = $request->input('steps');
            
            Log::info("updateFormConfig request received", [
                'shop' => $shopDomain,
                'has_steps' => isset($steps),
                'steps_count' => is_array($steps) ? count($steps) : 'not an array'
            ]);

            $val = is_array($steps) ? json_encode($steps) : $steps;

            $setting = \App\Models\B2BQuoteSetting::updateOrCreate(
                ['shop_domain' => $shopDomain, 'setting_key' => 'b2b_form_steps'],
                ['setting_value' => $val]
            );

            Log::info("Form configuration saved successfully to database", [
                'id' => $setting->id,
                'shop' => $setting->shop_domain
            ]);

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

    /**
     * Cancel any active Shopify recurring app subscriptions before downgrading to Free.
     */
    private function cancelActiveShopifySubscriptions(\App\Models\ShopifyShop $shop, string $shopDomain): void
    {
        $subscriptionIds = [];

        if (!empty($shop->shopify_subscription_id)) {
            $subscriptionIds[] = $shop->shopify_subscription_id;
        }

        // Also query Shopify directly in case subscription ID wasn't stored locally
        $activeQuery = '
        query {
          currentAppInstallation {
            activeSubscriptions {
              id
              status
            }
          }
        }';

        $activeRes = $this->queryShopifyGraphQL($activeQuery, [], $shopDomain);
        if ($activeRes['success']) {
            $activeSubs = $activeRes['data']['currentAppInstallation']['activeSubscriptions'] ?? [];
            foreach ($activeSubs as $sub) {
                if (!empty($sub['id']) && !in_array($sub['id'], $subscriptionIds, true)) {
                    $subscriptionIds[] = $sub['id'];
                }
            }
        }

        if (empty($subscriptionIds)) {
            return;
        }

        $cancelMutation = '
        mutation appSubscriptionCancel($id: ID!) {
          appSubscriptionCancel(id: $id) {
            appSubscription {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }';

        foreach ($subscriptionIds as $subId) {
            $cancelRes = $this->queryShopifyGraphQL($cancelMutation, ['id' => $subId], $shopDomain);
            if ($cancelRes['success']) {
                $errors = $cancelRes['data']['appSubscriptionCancel']['userErrors'] ?? [];
                if (!empty($errors)) {
                    Log::warning("Failed to cancel Shopify subscription {$subId} for {$shopDomain}", ['errors' => $errors]);
                } else {
                    Log::info("Cancelled Shopify subscription {$subId} for {$shopDomain}");
                }
            }
        }
    }

    /**
     * Resolve the active shop domain from request.
     */
    private function resolveShopDomain(Request $request): ?string
    {
        $shop = $request->header('X-Shop-Domain') 
            ?? $request->input('shop') 
            ?? $request->query('shop');

        if (!$shop && config('app.env') === 'testing') {
            $shop = config('shopify.shop_domain');
        }

        if ($shop) {
            $shop = preg_replace('/^https?:\/\//i', '', $shop);
            $shop = explode('/', $shop)[0];
        }

        return $shop;
    }



    /**
     * Trigger Shopify Flow event for B2B Registration Form Submitted
     */
    private function triggerFlowRegistrationSubmitted($application, string $shopDomain): void
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

        $customerId = $application->shopify_customer_id;
        
        // 1. Try to search for existing Shopify Customer GID by registration email
        if (!$customerId && !empty($application->email)) {
            $customerId = $this->getShopifyCustomerIdByEmail($application->email, $shopDomain);
        }

        // 2. Fallback: Query Shopify for first customer GID
        if (!$customerId) {
            $customerId = $this->getFirstShopifyCustomerId($shopDomain);
        }

        // 3. Fallback: Search for any approved registration locally
        if (!$customerId) {
            $existing = \App\Models\B2BApplication::where('shop_domain', $shopDomain)
                ->whereNotNull('shopify_customer_id')
                ->where('shopify_customer_id', '!=', '')
                ->first();
            if ($existing) {
                $customerId = $existing->shopify_customer_id;
            }
        }

        // 4. Fallback: Use dummy GID
        if (!$customerId) {
            $customerId = "gid://shopify/Customer/1";
        }

        $numericId = null;
        if ($customerId && $customerId !== "gid://shopify/Customer/1") {
            if (preg_match('/\/([0-9]+)$/', $customerId, $matches)) {
                $numericId = (int)$matches[1];
            } else if (is_numeric($customerId)) {
                $numericId = (int)$customerId;
            }
        }

        $shopName = explode('.', $shopDomain)[0];
        $appHandle = config('shopify.app_handle', 'b2bdev');
        $appLink = "https://admin.shopify.com/store/{$shopName}/apps/{$appHandle}/customers/{$application->id}";

        $payload = [
            'Your field key' => 'New B2B registration submitted by: ' . $application->first_name . ' ' . $application->last_name . ' (' . $application->company_name . ')',
            'customer name' => $application->first_name . ' ' . $application->last_name,
            'company name' => $application->company_name,
            'email' => $application->email,
            'application link' => $appLink,
            'customer_id' => $numericId
        ];

        Log::info("Triggering Shopify Flow for b2b-registration-form-submitted", [
            'shop' => $shopDomain,
            'payload' => $payload
        ]);

        $res = $this->queryShopifyGraphQL($mutation, [
            'handle' => 'b2b-registration-form-submitted',
            'payload' => $payload
        ], $shopDomain);

        if (!$res['success']) {
            Log::error("Failed to trigger Shopify Flow b2b-registration-form-submitted: " . json_encode($res['errors'] ?? $res['error'] ?? 'Unknown error'));
        } else {
            $errors = $res['data']['flowTriggerReceive']['userErrors'] ?? [];
            if (!empty($errors)) {
                Log::error("Shopify Flow b2b-registration-form-submitted returned userErrors: " . json_encode($errors));
            } else {
                Log::info("Successfully triggered Shopify Flow b2b-registration-form-submitted");
            }
        }
    }


}
