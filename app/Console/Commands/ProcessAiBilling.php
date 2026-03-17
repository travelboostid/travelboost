<?php

namespace App\Console\Commands;

use App\Models\AiBillingCycle;
use App\Models\AiCredit;
use App\Models\AiUsageLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ProcessAiBilling extends Command
{
  protected $signature = 'ai:billing';

  protected $description = 'Process daily AI usage billing';
  public function handle()
  {
    $this->info('Starting AI billing process...');

    AiUsageLog::whereNull('billing_cycle_id')
      ->select('company_id')
      ->distinct()
      ->chunk(1000, function ($companies) {
        foreach ($companies as $row) {
          DB::transaction(function () use ($row) {
            $companyId = $row->company_id;

            // Sum unbilled usage
            $totalCost = AiUsageLog::where('company_id', $companyId)
              ->whereNull('billing_cycle_id')
              ->sum('cost');

            if ($totalCost <= 0) {
              return;
            }

            // Create billing cycle
            $cycle = AiBillingCycle::create([
              'company_id' => $companyId,
              'total_cost' => $totalCost,
              'started_at' => now()->startOfDay(),
              'ended_at' => now(),
            ]);

            // Attach logs to billing cycle
            AiUsageLog::where('company_id', $companyId)
              ->whereNull('billing_cycle_id')
              ->update([
                'billing_cycle_id' => $cycle->id
              ]);

            // Deduct credits
            AiCredit::where('company_id', $companyId)
              ->decrement('balance', $totalCost);
          });
        }
      });

    $this->info('AI billing completed.');

    return Command::SUCCESS;
  }
}
