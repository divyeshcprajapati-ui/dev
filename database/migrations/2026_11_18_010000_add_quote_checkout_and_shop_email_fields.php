<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('b2b_quotes', function (Blueprint $table) {
            if (!Schema::hasColumn('b2b_quotes', 'draft_order_id')) {
                $table->string('draft_order_id')->nullable()->after('image_url');
            }
            if (!Schema::hasColumn('b2b_quotes', 'invoice_url')) {
                $table->text('invoice_url')->nullable()->after('draft_order_id');
            }
        });

        Schema::table('shopify_shops', function (Blueprint $table) {
            if (!Schema::hasColumn('shopify_shops', 'staff_email')) {
                $table->string('staff_email')->nullable()->after('shop_name');
            }
        });
    }

    public function down()
    {
        Schema::table('b2b_quotes', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('b2b_quotes', 'draft_order_id')) $cols[] = 'draft_order_id';
            if (Schema::hasColumn('b2b_quotes', 'invoice_url')) $cols[] = 'invoice_url';
            if (!empty($cols)) $table->dropColumn($cols);
        });

        Schema::table('shopify_shops', function (Blueprint $table) {
            if (Schema::hasColumn('shopify_shops', 'staff_email')) {
                $table->dropColumn('staff_email');
            }
        });
    }
};
