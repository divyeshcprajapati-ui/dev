<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class B2BTranslation extends Model
{
    protected $table = 'b2b_translations';

    protected $fillable = [
        'shop_domain',
        'locale',
        'section',
        'translation_key',
        'value',
    ];
}
