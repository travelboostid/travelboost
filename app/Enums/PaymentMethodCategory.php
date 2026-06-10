<?php

namespace App\Enums;

enum PaymentMethodCategory: string
{
    case BANK_TRANSFER = 'banktransfer';
    case CREDIT_CARD = 'creditcard';
    case CONVENIENCE_STORE = 'conveniencestore';
    case QRIS = 'qris';
}
