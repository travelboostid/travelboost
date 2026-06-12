<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\AgentIndexRequest;
use App\Models\Company;
use App\Models\VendorAgentPartner;
use App\Notifications\PaymentModeChangedNotification;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class AgentRegistrationController extends Controller
{
    public function index(Company $company, AgentIndexRequest $request): Response
    {
        $validated = $request->validated();

        $data = $company->agentPartners()
            ->with([
                'agent' => function ($query) {
                    $query->with(['photo', 'identityCard']);
                },
                'agentTier',
            ])
            ->when($validated['agent.name'] ?? null, function ($query, $name) {
                $query->whereHas('agent', function ($query) use ($name) {
                    $query->whereRaw('LOWER(COALESCE(name, \'\')) LIKE ?', [Str::lower($name).'%']);
                });
            })
            ->when(request('sort'), function ($query) {
                $sorts = explode(',', (string) request('sort'));
                foreach ($sorts as $sort) {
                    if (str_starts_with($sort, '-')) {
                        $query->orderBy(substr($sort, 1), 'desc');
                    } else {
                        $query->orderBy($sort, 'asc');
                    }
                }
            })
            ->paginate()
            ->withQueryString();

        return Inertia::render('companies/dashboard/agent-registrations/index', [
            'data' => $data,
            'agentTiers' => $company->agentTiers()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function exportExcel(Company $company, Request $request): BinaryFileResponse
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
            'agent_registrations_'.now()->format('Y-m-d_His').'.xlsx',
        );
    }

    public function exportPdf(Company $company, Request $request): HttpResponse
    {
        $payload = $this->exportPayload($company, $request);

        return Pdf::setOption(['isRemoteEnabled' => true])
            ->loadView('exports.simple-table-report', [
                ...$payload,
                'isExcel' => false,
                'autoPrint' => false,
            ])
            ->setPaper('A4', 'landscape')
            ->stream('agent_registrations_'.now()->format('Y-m-d_His').'.pdf');
    }

    public function print(Company $company, Request $request): View
    {
        return view('exports.simple-table-report', [
            ...$this->exportPayload($company, $request),
            'isExcel' => false,
            'autoPrint' => true,
        ]);
    }

    public function update(Request $request, Company $company, VendorAgentPartner $agent_registration): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
            'agent_tier_id' => [
                'nullable',
                Rule::exists('agent_tiers', 'id')->where('company_id', $company->id),
            ],
            'show_vendor_name' => ['nullable', 'boolean'],
            'payment_mode' => ['nullable', 'in:vendor,agent'],
            'manual_payment_enabled' => ['nullable', 'boolean'],
            'online_payment_enabled' => ['nullable', 'boolean'],
        ]);

        if (isset($data['status']) && $data['status'] === 'active' && is_null($agent_registration->accepted_at)) {
            $data['accepted_at'] = now();
        }

        $agent_registration->update($data);

        if ($agent_registration->wasChanged('payment_mode')) {
            $agent_registration->agent->notify(new PaymentModeChangedNotification($agent_registration));
        }

        return back();
    }

    public function destroy(Company $company, VendorAgentPartner $agent_registration): RedirectResponse
    {
        $agent_registration->delete();

        return back();
    }

    private function exportPayload(Company $company, Request $request): array
    {
        $rows = $this->registrationRows($company, $request)->map(function (array $row): array {
            return [
                'Agent Name' => $row['agent_name'],
                'Email' => $row['email'],
                'Phone' => $row['phone'],
                'Status' => $row['status'],
                'Agent Tier' => $row['agent_tier'],
                'Payment Mode' => $row['payment_mode'],
                'Manual Payment' => $row['manual_payment_enabled'],
                'Online Payment' => $row['online_payment_enabled'],
                'Show Vendor Name' => $row['show_vendor_name'],
                'Applied At' => $row['applied_at'],
                'Accepted At' => $row['accepted_at'],
                'Note' => $row['note'],
            ];
        })->values();

        return [
            'title' => 'Agent Registrations',
            'subtitle' => 'Registration, tier, and payment settings for agents.',
            'reportKey' => 'agent_registrations',
            'columns' => $rows->isNotEmpty() ? array_keys($rows->first()) : [],
            'rows' => $rows,
        ];
    }

    private function registrationRows(Company $company, Request $request): Collection
    {
        $search = trim(Str::lower((string) $request->input('search', '')));
        $status = (string) $request->input('status', 'all');

        return $company->agentPartners()
            ->with([
                'agent',
                'agentTier',
            ])
            ->when($status !== 'all', function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->map(function (VendorAgentPartner $registration): array {
                return [
                    'agent_name' => $registration->agent?->name ?? '-',
                    'email' => $registration->agent?->email ?? '-',
                    'phone' => $registration->agent?->phone ?? '-',
                    'status' => $registration->status ?? '-',
                    'agent_tier' => $registration->agentTier?->name ?? 'No Tier',
                    'payment_mode' => $registration->payment_mode ?? 'vendor',
                    'manual_payment_enabled' => ($registration->manual_payment_enabled ?? true) ? 'Enabled' : 'Disabled',
                    'online_payment_enabled' => ($registration->online_payment_enabled ?? true) ? 'Enabled' : 'Disabled',
                    'show_vendor_name' => ($registration->show_vendor_name ?? false) ? 'Yes' : 'No',
                    'applied_at' => optional($registration->created_at)->format('Y-m-d H:i:s'),
                    'accepted_at' => optional($registration->accepted_at)->format('Y-m-d H:i:s') ?: '-',
                    'note' => $registration->note ?: '-',
                ];
            })
            ->filter(function (array $row) use ($search): bool {
                if ($search === '') {
                    return true;
                }

                return collect($row)->contains(function ($value) use ($search): bool {
                    return str_contains(Str::lower((string) $value), $search);
                });
            })
            ->values();
    }
}
