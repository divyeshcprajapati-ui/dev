<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Update b2b_applications
        Schema::table('b2b_applications', function (Blueprint $table) {
            $table->string('shop_domain')->nullable()->index()->after('id');
        });

        // 2. Update b2b_quotes
        Schema::table('b2b_quotes', function (Blueprint $table) {
            $table->string('shop_domain')->nullable()->index()->after('id');
        });

        // 3. Update b2b_quote_settings
        Schema::table('b2b_quote_settings', function (Blueprint $table) {
            $table->dropUnique('b2b_quote_settings_setting_key_unique');
            $table->string('shop_domain')->nullable()->index()->after('id');
            $table->unique(['shop_domain', 'setting_key'], 'quote_settings_shop_key_unique');
        });

        // 4. Update b2b_notification_settings
        Schema::table('b2b_notification_settings', function (Blueprint $table) {
            $table->dropUnique('b2b_notification_settings_setting_key_unique');
            $table->string('shop_domain')->nullable()->index()->after('id');
            $table->unique(['shop_domain', 'setting_key'], 'notification_settings_shop_key_unique');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('b2b_applications', function (Blueprint $table) {
            $table->dropColumn('shop_domain');
        });

        Schema::table('b2b_quotes', function (Blueprint $table) {
            $table->dropColumn('shop_domain');
        });

        Schema::table('b2b_quote_settings', function (Blueprint $table) {
            $table->dropUnique('quote_settings_shop_key_unique');
            $table->dropColumn('shop_domain');
            $table->unique('setting_key', 'b2b_quote_settings_setting_key_unique');
        });

        Schema::table('b2b_notification_settings', function (Blueprint $table) {
            $table->dropUnique('notification_settings_shop_key_unique');
            $table->dropColumn('shop_domain');
            $table->unique('setting_key', 'b2b_notification_settings_setting_key_unique');
        });
    }
};
