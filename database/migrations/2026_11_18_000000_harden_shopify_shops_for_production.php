<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
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
        // Widen token columns to TEXT so Laravel encrypted payloads fit cleanly
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE shopify_shops MODIFY access_token TEXT NOT NULL');
            DB::statement('ALTER TABLE shopify_shops MODIFY refresh_token TEXT NULL');
        }

        Schema::table('shopify_shops', function (Blueprint $table) {
            if (!Schema::hasColumn('shopify_shops', 'shopify_subscription_id')) {
                $table->string('shopify_subscription_id')->nullable()->after('selected_modules');
            }
            if (!Schema::hasColumn('shopify_shops', 'billing_cycle')) {
                $table->string('billing_cycle', 20)->default('monthly')->after('shopify_subscription_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('shopify_shops', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('shopify_shops', 'shopify_subscription_id')) {
                $columns[] = 'shopify_subscription_id';
            }
            if (Schema::hasColumn('shopify_shops', 'billing_cycle')) {
                $columns[] = 'billing_cycle';
            }
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
