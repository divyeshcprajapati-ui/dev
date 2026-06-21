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
        Schema::create('b2b_quotes', function (Blueprint $table) {
            $table->id();
            $table->string('quote_number');
            $table->string('status')->default('Pending'); // Pending, Read, Sent, Approved, Rejected
            $table->string('product_name');
            $table->decimal('original_price', 10, 2);
            $table->decimal('quoted_price', 10, 2);
            $table->integer('quantity');
            $table->decimal('subtotal', 10, 2);
            $table->boolean('apply_to_future_orders')->default(false);
            $table->date('expiration_date')->nullable();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('company_name');
            $table->text('company_location');
            $table->text('shipping_address');
            $table->text('billing_address')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('b2b_quotes');
    }
};
