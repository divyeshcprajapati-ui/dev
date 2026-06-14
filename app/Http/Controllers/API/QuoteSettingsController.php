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
    public function getSettings()
    {
        $settings = B2BQuoteSetting::all()->pluck('setting_value', 'setting_key');
        
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
        $settings = $request->input('settings', []);

        foreach ($settings as $key => $value) {
            B2BQuoteSetting::updateOrCreate(
                ['setting_key' => $key],
                ['setting_value' => is_array($value) ? json_encode($value) : $value]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully'
        ]);
    }
}
