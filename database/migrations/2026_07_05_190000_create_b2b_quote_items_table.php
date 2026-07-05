<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Create b2b_quote_items table
        Schema::create('b2b_quote_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('b2b_quote_id');
            $table->string('product_name');
            $table->decimal('original_price', 10, 2);
            $table->decimal('quoted_price', 10, 2);
            $table->integer('quantity');
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();

            $table->foreign('b2b_quote_id')->references('id')->on('b2b_quotes')->onDelete('cascade');
        });

        // 2. Copy existing data from b2b_quotes to b2b_quote_items
        $quotes = DB::table('b2b_quotes')->get();
        foreach ($quotes as $quote) {
            if (!empty($quote->product_name)) {
                DB::table('b2b_quote_items')->insert([
                    'b2b_quote_id' => $quote->id,
                    'product_name' => $quote->product_name,
                    'original_price' => $quote->original_price,
                    'quoted_price' => $quote->quoted_price,
                    'quantity' => $quote->quantity,
                    'subtotal' => $quote->subtotal,
                    'created_at' => $quote->created_at,
                    'updated_at' => $quote->updated_at,
                ]);
            }
        }

        // 3. Make the old fields on b2b_quotes nullable
        $dbDriver = DB::connection()->getDriverName();
        if ($dbDriver === 'mysql') {
            DB::statement('ALTER TABLE b2b_quotes MODIFY product_name VARCHAR(255) NULL');
            DB::statement('ALTER TABLE b2b_quotes MODIFY original_price DECIMAL(10,2) NULL');
            DB::statement('ALTER TABLE b2b_quotes MODIFY quoted_price DECIMAL(10,2) NULL');
            DB::statement('ALTER TABLE b2b_quotes MODIFY quantity INT NULL');
            DB::statement('ALTER TABLE b2b_quotes MODIFY subtotal DECIMAL(10,2) NULL');
        } else {
            Schema::table('b2b_quotes', function (Blueprint $table) {
                $table->string('product_name')->nullable()->change();
                $table->decimal('original_price', 10, 2)->nullable()->change();
                $table->decimal('quoted_price', 10, 2)->nullable()->change();
                $table->integer('quantity')->nullable()->change();
                $table->decimal('subtotal', 10, 2)->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('b2b_quote_items');

        $dbDriver = DB::connection()->getDriverName();
        if ($dbDriver === 'mysql') {
            DB::statement('ALTER TABLE b2b_quotes MODIFY product_name VARCHAR(255) NOT NULL');
            DB::statement('ALTER TABLE b2b_quotes MODIFY original_price DECIMAL(10,2) NOT NULL');
            DB::statement('ALTER TABLE b2b_quotes MODIFY quoted_price DECIMAL(10,2) NOT NULL');
            DB::statement('ALTER TABLE b2b_quotes MODIFY quantity INT NOT NULL');
            DB::statement('ALTER TABLE b2b_quotes MODIFY subtotal DECIMAL(10,2) NOT NULL');
        } else {
            Schema::table('b2b_quotes', function (Blueprint $table) {
                $table->string('product_name')->nullable(false)->change();
                $table->decimal('original_price', 10, 2)->nullable(false)->change();
                $table->decimal('quoted_price', 10, 2)->nullable(false)->change();
                $table->integer('quantity')->nullable(false)->change();
                $table->decimal('subtotal', 10, 2)->nullable(false)->change();
            });
        }
    }
};
