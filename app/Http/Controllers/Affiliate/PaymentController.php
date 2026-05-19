<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
  public function index(Request $request): Response
  {
    $user = $request->user();

    $from = $request->input('from')
      ? Carbon::parse($request->input('from'))->startOfDay()
      : now()->subMonth()->startOfDay();

    $to = $request->input('to')
      ? Carbon::parse($request->input('to'))->endOfDay()
      : now()->endOfDay();

    $commissions = DB::table('affiliate_commission_histories')
      ->join('companies', 'affiliate_commission_histories.company_id', '=', 'companies.id')
      ->leftJoin('payments', 'affiliate_commission_histories.payment_id', '=', 'payments.id')
      ->select(
        'affiliate_commission_histories.id',
        'affiliate_commission_histories.tier',
        'affiliate_commission_histories.base_amount',
        'affiliate_commission_histories.commission_rate',
        'affiliate_commission_histories.commission_amount',
        'affiliate_commission_histories.status',
        'affiliate_commission_histories.created_at',
        'companies.name as company_name',
        'companies.username as company_username',
        'payments.provider',
        'payments.payment_method',
      )
      ->where('affiliate_commission_histories.recipient_id', $user->id)
      ->whereBetween('affiliate_commission_histories.created_at', [$from, $to])
      ->orderByDesc('affiliate_commission_histories.created_at')
      ->get();

    return Inertia::render('affiliate/dashboard/fund/payments/index', [
      'commissions' => $commissions,
      'filters' => [
        'from' => $request->input('from') ? $from->toDateString() : null,
        'to' => $request->input('to') ? $to->toDateString() : null,
      ],
      'summary' => [
        'total_records' => $commissions->count(),
        'total_amount' => (int) round($commissions->sum('commission_amount')),
      ],
    ]);
  }
}
