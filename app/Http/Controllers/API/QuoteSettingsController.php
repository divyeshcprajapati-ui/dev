<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\B2BQuoteSetting;

class QuoteSettingsController extends Controller
{
    /**
     * Get all quote settings
     */
    public function getSettings(Request $request)
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
        
        $settings = B2BQuoteSetting::where('shop_domain', $shop)
            ->pluck('setting_value', 'setting_key');
        
        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    /**
     * Update quote settings
     */
    public function updateSettings(Request $request)
    {
        $shop = $request->header('X-Shop-Domain') ?? $request->query('shop');
        $settings = $request->input('settings', []);

        foreach ($settings as $key => $value) {
            $dbValue = $value;
            if (is_bool($value)) {
                $dbValue = $value ? 'true' : 'false';
            } elseif (is_array($value)) {
                $dbValue = json_encode($value);
            }

            B2BQuoteSetting::updateOrCreate(
                [
                    'shop_domain' => $shop,
                    'setting_key' => $key
                ],
                ['setting_value' => $dbValue]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully'
        ]);
    }
}
