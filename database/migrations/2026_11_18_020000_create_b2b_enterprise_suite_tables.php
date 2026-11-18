<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('b2b_translations')) {
            Schema::create('b2b_translations', function (Blueprint $table) {
                $table->id();
                $table->string('shop_domain')->index();
                $table->string('locale', 16)->index();
                $table->string('section', 64)->index();
                $table->string('translation_key', 120);
                $table->text('value')->nullable();
                $table->timestamps();
                $table->unique(['shop_domain', 'locale', 'section', 'translation_key'], 'b2b_trans_unique');
            });
        }

        if (!Schema::hasTable('b2b_shopping_lists')) {
            Schema::create('b2b_shopping_lists', function (Blueprint $table) {
                $table->id();
                $table->string('shop_domain')->index();
                $table->string('customer_email')->index();
                $table->string('customer_name')->nullable();
                $table->string('company_name')->nullable();
                $table->string('name');
                $table->string('status', 32)->default('Draft')->index();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('b2b_shopping_list_items')) {
            Schema::create('b2b_shopping_list_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('b2b_shopping_list_id')->constrained('b2b_shopping_lists')->onDelete('cascade');
                $table->string('product_title');
                $table->string('variant_id')->nullable();
                $table->string('sku')->nullable();
                $table->decimal('price', 12, 2)->default(0);
                $table->unsignedInteger('quantity')->default(1);
                $table->text('image_url')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('b2b_company_members')) {
            Schema::create('b2b_company_members', function (Blueprint $table) {
                $table->id();
                $table->string('shop_domain')->index();
                $table->string('company_name')->index();
                $table->string('name');
                $table->string('email')->index();
                $table->string('role', 32)->default('Buyer');
                $table->json('permissions')->nullable();
                $table->string('status', 32)->default('Active');
                $table->timestamps();
                $table->unique(['shop_domain', 'company_name', 'email'], 'b2b_member_unique');
            });
        }

        if (!Schema::hasTable('b2b_credit_accounts')) {
            Schema::create('b2b_credit_accounts', function (Blueprint $table) {
                $table->id();
                $table->string('shop_domain')->index();
                $table->string('company_name');
                $table->string('customer_email')->index();
                $table->decimal('credit_limit', 14, 2)->default(0);
                $table->decimal('balance_used', 14, 2)->default(0);
                $table->string('currency', 8)->default('USD');
                $table->string('payment_terms', 64)->default('Net 30');
                $table->string('status', 32)->default('Active');
                $table->timestamps();
                $table->unique(['shop_domain', 'company_name'], 'b2b_credit_unique');
            });
        }

        if (!Schema::hasTable('b2b_ledger_entries')) {
            Schema::create('b2b_ledger_entries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('b2b_credit_account_id')->constrained('b2b_credit_accounts')->onDelete('cascade');
                $table->string('shop_domain')->index();
                $table->string('type', 32); // charge, payment, adjustment
                $table->decimal('amount', 14, 2);
                $table->string('reference')->nullable();
                $table->text('notes')->nullable();
                $table->string('created_by')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('b2b_ledger_entries');
        Schema::dropIfExists('b2b_credit_accounts');
        Schema::dropIfExists('b2b_company_members');
        Schema::dropIfExists('b2b_shopping_list_items');
        Schema::dropIfExists('b2b_shopping_lists');
        Schema::dropIfExists('b2b_translations');
    }
};
