<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class B2BLedgerEntry extends Model
{
    protected $table = 'b2b_ledger_entries';

    protected $fillable = [
        'b2b_credit_account_id',
        'shop_domain',
        'type',
        'amount',
        'reference',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function account()
    {
        return $this->belongsTo(B2BCreditAccount::class, 'b2b_credit_account_id');
    }
}
