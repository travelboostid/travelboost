<?php

namespace App\Enums;

enum PromotionBudgetTransactionType: string
{
    case Topup = 'topup';
    case Spend = 'spend';
    case Adjustment = 'adjustment';
}
