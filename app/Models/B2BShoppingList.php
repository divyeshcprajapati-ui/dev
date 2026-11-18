<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class B2BShoppingList extends Model
{
    protected $table = 'b2b_shopping_lists';

    protected $fillable = [
        'shop_domain',
        'customer_email',
        'customer_name',
        'company_name',
        'name',
        'status',
        'notes',
    ];

    public function items()
    {
        return $this->hasMany(B2BShoppingListItem::class, 'b2b_shopping_list_id');
    }
}
