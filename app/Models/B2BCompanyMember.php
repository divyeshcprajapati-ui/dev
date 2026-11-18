<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class B2BCompanyMember extends Model
{
    protected $table = 'b2b_company_members';

    protected $fillable = [
        'shop_domain',
        'company_name',
        'name',
        'email',
        'role',
        'permissions',
        'status',
    ];

    protected $casts = [
        'permissions' => 'array',
    ];
}
