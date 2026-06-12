<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\CustomerIndexRequest;
use App\Http\Requests\UpdateCompanyTeamRequest;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\User;
use App\Notifications\CustomerCustomNotification;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\View\View;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CustomerController extends Controller
{
    public function index(Company $company, CustomerIndexRequest $request)
    {
        $validated = $request->validated();
        $agentIds = $this->activeAgentIds($company);

        $customers = $this->applySorting(
            $this->filteredCustomersQuery($company, $agentIds, $validated),
            $validated['sort'] ?? '-created_at',
        )
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return Inertia::render('companies/dashboard/customers/index', [
            'data' => $customers,
        ]);
    }

    public function exportExcel(Company $company, CustomerIndexRequest $request): BinaryFileResponse
    {
        $payload = $this->exportPayload($company, $request);

        return Excel::download(
            new class($payload) implements FromView, ShouldAutoSize
            {
                public function __construct(private readonly array $payload) {}

                public function view(): View
                {
                    return view('exports.simple-table-report', [
                        ...$this->payload,
                        'isExcel' => true,
                        'autoPrint' => false,
                    ]);
                }
            },
            'customers_'.now()->format('Y-m-d_His').'.xlsx',
        );
    }

    public function exportPdf(Company $company, CustomerIndexRequest $request): HttpResponse
    {
        $payload = $this->exportPayload($company, $request);

        return Pdf::setOption(['isRemoteEnabled' => true])
            ->loadView('exports.simple-table-report', [
                ...$payload,
                'isExcel' => false,
                'autoPrint' => false,
            ])
            ->setPaper('A4', 'landscape')
            ->stream('customers_'.now()->format('Y-m-d_His').'.pdf');
    }

    public function print(Company $company, CustomerIndexRequest $request): View
    {
        return view('exports.simple-table-report', [
            ...$this->exportPayload($company, $request),
            'isExcel' => false,
            'autoPrint' => true,
        ]);
    }

    /**
     * @param  Collection<int, int|string>  $agentIds
     * @param  array<string, mixed>  $validated
     */
    private function filteredCustomersQuery(
        Company $company,
        Collection $agentIds,
        array $validated,
    ): Builder {
        return User::query()
            ->where(function (Builder $query) use ($company, $agentIds): void {
                $query->where('company_id', $company->id);

                if ($agentIds->isNotEmpty()) {
                    $query->orWhereIn('company_id', $agentIds);
                }
            })
            ->with('company:id,name')
            ->when($validated['name'] ?? null, function (Builder $query, string $name): void {
                $query->where('name', 'ilike', '%'.$name.'%');
            })
            ->when($validated['username'] ?? null, function (Builder $query, string $username): void {
                $query->where('username', 'ilike', '%'.$username.'%');
            })
            ->when($validated['email'] ?? null, function (Builder $query, string $email): void {
                $query->where('email', 'ilike', '%'.$email.'%');
            })
            ->when($validated['agent_name'] ?? null, function (Builder $query, string $agentName): void {
                $query->whereHas('company', function (Builder $companyQuery) use ($agentName): void {
                    $companyQuery->where('name', 'ilike', '%'.$agentName.'%');
                });
            })
            ->when($validated['registration_source'] ?? null, function (Builder $query, string $source) use ($company, $agentIds): void {
                if ($source === 'direct') {
                    $query->where('company_id', $company->id);

                    return;
                }

                if ($agentIds->isEmpty()) {
                    $query->whereRaw('1 = 0');

                    return;
                }

                $query->whereIn('company_id', $agentIds);
            })
            ->when($validated['status'] ?? null, function (Builder $query, array $status): void {
                $query->whereIn('status', $status);
            })
            ->when($validated['gender'] ?? null, function (Builder $query, array $gender): void {
                $query->whereIn('gender', $gender);
            })
            ->when($validated['created_at'] ?? null, function (Builder $query, string $createdAt): void {
                $range = explode(',', $createdAt);

                if (count($range) === 2) {
                    $from = Carbon::createFromTimestamp((int) $range[0] / 1000);
                    $to = Carbon::createFromTimestamp((int) $range[1] / 1000);
                    $query->whereBetween('created_at', [$from, $to]);

                    return;
                }

                $date = Carbon::createFromTimestamp((int) $range[0] / 1000);
                $query->whereDate('created_at', $date);
            });
    }

    private function applySorting(Builder $query, string $sort): Builder
    {
        foreach (explode(',', $sort) as $item) {
            $direction = str_starts_with($item, '-') ? 'desc' : 'asc';
            $field = ltrim($item, '-');

            if ($field === 'agent_name') {
                $query
                    ->leftJoin('companies as customer_agent_companies', 'users.company_id', '=', 'customer_agent_companies.id')
                    ->orderBy('customer_agent_companies.name', $direction)
                    ->select('users.*');

                continue;
            }

            if (in_array($field, ['id', 'name', 'username', 'email', 'phone', 'gender', 'status', 'created_at'], true)) {
                $query->orderBy($field, $direction);
            }
        }

        return $query;
    }

    private function exportPayload(Company $company, CustomerIndexRequest $request): array
    {
        $validated = $request->validated();
        $agentIds = $this->activeAgentIds($company);
        $companyType = strtolower($company->type->value ?? $company->type);

        $rows = $this->applySorting(
            $this->filteredCustomersQuery($company, $agentIds, $validated),
            $validated['sort'] ?? '-created_at',
        )
            ->get()
            ->map(function (User $customer) use ($companyType): array {
                $row = [
                    'Customer Name' => $customer->name ?: '-',
                    'Username' => $customer->username ? '@'.$customer->username : '-',
                    'Email' => $customer->email ?: '-',
                    'Phone' => $customer->phone ?: '-',
                    'Address' => $customer->address ?: '-',
                    'Gender' => $customer->gender ?: '-',
                    'Status' => $customer->status ?: '-',
                    'Registration Source' => $customer->company?->name ? 'Via Agent' : 'Direct',
                    'Join Date' => optional($customer->created_at)->format('Y-m-d H:i:s') ?: '-',
                ];

                if ($companyType === 'vendor') {
                    $row = [
                        ...$row,
                        'Agent Name' => $customer->company?->name ?? 'Direct Registration',
                    ];
                }

                return $row;
            })
            ->values();

        return [
            'title' => 'Customers',
            'subtitle' => $companyType === 'vendor'
                ? 'Customer list across direct and agent registrations.'
                : 'Customer list registered under your agent account.',
            'reportKey' => 'customers',
            'columns' => $rows->isNotEmpty() ? array_keys($rows->first()) : [],
            'rows' => $rows,
        ];
    }

    /**
     * @return Collection<int, int|string>
     */
    private function activeAgentIds(Company $company): Collection
    {
        return $company->agentPartners()
            ->where('status', 'active')
            ->pluck('agent_id');
    }

    public function sendNotification(Request $request, Company $company, User $customer): RedirectResponse
    {
        abort_unless($this->customerBelongsToCompanyNetwork($company, $customer), 404);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:2000'],
            'channel' => ['required', 'in:dashboard,email,both'],
        ]);

        $customer->notify(new CustomerCustomNotification(
            title: $validated['title'],
            message: $validated['message'],
            channel: $validated['channel'],
            senderCompany: $company,
        ));

        return back()->with('success', 'Notification sent successfully.');
    }

    public function update(UpdateCompanyTeamRequest $request, Company $company, CompanyTeam $member)
    {
        $member->update($request->validated());

        return back();
    }

    private function customerBelongsToCompanyNetwork(Company $company, User $customer): bool
    {
        $agentIds = $this->activeAgentIds($company);

        if ((int) $customer->company_id === (int) $company->id) {
            return true;
        }

        return $agentIds->contains(fn ($agentId) => (int) $agentId === (int) $customer->company_id);
    }
}
