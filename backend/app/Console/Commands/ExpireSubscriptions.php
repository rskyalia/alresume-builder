<?php

namespace App\Console\Commands;

use App\Services\CreditService;
use Illuminate\Console\Command;

class ExpireSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire active subscriptions that have passed their expiry date and downgrade users to free plan.';

    public function __construct(private readonly CreditService $creditService)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * Requirement: 10.5
     */
    public function handle(): int
    {
        $count = $this->creditService->expireSubscriptions();

        $this->info("Expired {$count} subscription(s). Affected users downgraded to free plan.");

        return Command::SUCCESS;
    }
}
