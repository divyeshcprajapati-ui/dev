<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class B2BQuoteSetting extends Model
{
    use HasFactory;

    protected $table = 'b2b_quote_settings';

    protected $fillable = [
        'setting_key',
        'setting_value',
    ];
}
