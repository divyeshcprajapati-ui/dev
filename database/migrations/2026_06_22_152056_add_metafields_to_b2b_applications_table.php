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
        Schema::table('b2b_applications', function (Blueprint $table) {
            $table->text('metafields')->nullable();
            $table->string('shopify_company_id')->nullable();
            $table->string('shopify_location_id')->nullable();
            $table->string('shopify_contact_id')->nullable();
            $table->string('shopify_customer_id')->nullable();
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
            $table->dropColumn(['metafields', 'shopify_company_id', 'shopify_location_id', 'shopify_contact_id', 'shopify_customer_id']);
        });
    }
};
