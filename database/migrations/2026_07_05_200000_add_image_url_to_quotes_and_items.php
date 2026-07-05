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
        Schema::table('b2b_quotes', function (Blueprint $table) {
            $table->string('image_url', 500)->nullable()->after('product_name');
        });

        Schema::table('b2b_quote_items', function (Blueprint $table) {
            $table->string('image_url', 500)->nullable()->after('product_name');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('b2b_quotes', function (Blueprint $table) {
            $table->dropColumn('image_url');
        });

        Schema::table('b2b_quote_items', function (Blueprint $table) {
            $table->dropColumn('image_url');
        });
    }
};
