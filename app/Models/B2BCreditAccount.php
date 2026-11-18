<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class B2BCreditAccount extends Model
{
    protected $table = 'b2b_credit_accounts';

    protected $fillable = [
        'shop_domain',
        'company_name',
        'customer_email',
        'credit_limit',
        'balance_used',
        'currency',
        'payment_terms',
        'status',
    ];

    protected $casts = [
        'credit_limit' => 'float',
        'balance_used' => 'float',
    ];

    protected $appends = ['available_credit'];

    public function getAvailableCreditAttribute(): float
    {
        return max(0.0, round((float) $this->credit_limit - (float) $this->balance_used, 2));
    }

    public function entries()
    {
        return $this->hasMany(B2BLedgerEntry::class, 'b2b_credit_account_id')->orderBy('created_at', 'desc');
    }
}
