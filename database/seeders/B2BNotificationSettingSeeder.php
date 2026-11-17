<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\B2BNotificationSetting;

class B2BNotificationSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        B2BNotificationSetting::truncate();

        $settings = [
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

        foreach ($settings as $setting) {
            B2BNotificationSetting::create($setting);
        }
    }
}

