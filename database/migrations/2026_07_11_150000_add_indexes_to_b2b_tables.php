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
            $table->index(['shop_domain', 'email'], 'apps_shop_email_idx');
            $table->index('status', 'apps_status_idx');
        });

        Schema::table('b2b_quotes', function (Blueprint $table) {
            $table->index('status', 'quotes_status_idx');
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
            $table->dropIndex('apps_shop_email_idx');
            $table->dropIndex('apps_status_idx');
        });

        Schema::table('b2b_quotes', function (Blueprint $table) {
            $table->dropIndex('quotes_status_idx');
        });
    }
};
