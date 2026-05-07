<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\BookingPassenger;
use App\Models\Company;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BookingIndexController extends Controller
{
    public function index(Company $company, Request $request): Response
    {
        $bookings = Booking::query()
            ->when(($company->type->value ?? $company->type) === 'vendor', function ($query) use ($company) {
                $query->where('vendor_id', $company->id);
            })
            ->when(($company->type->value ?? $company->type) === 'agent', function ($query) use ($company) {
                $query->where('agent_id', $company->id);
            })
            ->when($request->input('booking_number'), function ($query, $search) {
                $query->where('booking_number', 'ilike', "{$search}%");
            })
            ->when($request->input('contact_name'), function ($query, $search) {
                $query->where('contact_name', 'ilike', "{$search}%");
            })
            ->when($request->input('status'), function ($query, $status) {
                if (in_array($status, ['reserved', 'booking reserved'], true)) {
                    $query->whereIn('status', ['reserved', 'booking reserved']);

                    return;
                }

                $query->where('status', $status);
            })
            ->when($request->input('sort'), function ($query) {
                $sorts = explode(',', request('sort'));
                foreach ($sorts as $sort) {
                    if (str_starts_with($sort, '-')) {
                        $query->orderBy(substr($sort, 1), 'desc');
                    } else {
                        $query->orderBy($sort, 'asc');
                    }
                }
            }, function ($query) {
                $query->latest();
            })
            ->with([
                'tour:id,name,code',
                'vendor:id,name',
                'agent:id,name',
                'user:id,name',
                'passengers:id,booking_id,price_category',
            ])
            ->withSum(['payments as paid_amount' => function ($query): void {
                $query->where('status', 'paid');
            }], 'amount')
            ->paginate();

        $bookings->getCollection()->transform(function ($booking) {
            $booking->commission_amount = $this->resolveCommissionAmount($booking);

            $paidAmount = (float) ($booking->paid_amount ?? 0);
            $booking->paid_amount = $paidAmount;
            $booking->remaining_balance = max(0, (float) $booking->grand_total - $paidAmount);

            return $booking;
        });

        return Inertia::render('companies/dashboard/bookings/index', [
            'data' => $bookings,
        ]);
    }

    public function show(Company $company, Booking $booking): Response
    {
        return $this->renderBookingPage($company, $booking, 'companies/dashboard/bookings/show');
    }

    public function edit(Company $company, Booking $booking): Response
    {
        return $this->renderBookingPage($company, $booking, 'companies/dashboard/bookings/edit');
    }

    public function update(Company $company, Booking $booking, UpdateBookingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($booking, $validated): void {
            $booking->update([
                'contact_name' => $validated['contact_name'],
                'contact_email' => $validated['contact_email'],
                'contact_phone' => $validated['contact_phone'],
                'contact_notes' => $validated['contact_notes'] ?? null,
                'pax_adult' => $validated['pax_adult'],
                'pax_child' => $validated['pax_child'],
                'pax_infant' => $validated['pax_infant'],
                'total_price' => $validated['total_price'],
                'tax_amount' => $validated['tax_amount'],
                'platform_fee' => $validated['platform_fee'],
                'commission_amount' => $validated['commission_amount'],
                'grand_total' => $validated['grand_total'],
            ]);

            $retainedPassengerIds = collect($validated['passengers'])
                ->pluck('id')
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->values();

            if ($retainedPassengerIds->isNotEmpty()) {
                $booking->passengers()
                    ->whereNotIn('id', $retainedPassengerIds)
                    ->delete();
            } else {
                $booking->passengers()->delete();
            }

            foreach ($validated['passengers'] as $passengerData) {
                $payload = [
                    'title' => $passengerData['title'] ?? null,
                    'first_name' => $passengerData['first_name'],
                    'last_name' => $passengerData['last_name'] ?? null,
                    'gender' => $passengerData['gender'] ?? null,
                    'dob' => $passengerData['dob'] ?? null,
                    'pob' => $passengerData['pob'] ?? null,
                    'nationality' => $passengerData['nationality'] ?? null,
                    'passport_number' => $passengerData['passport_number'] ?? null,
                    'passport_issue_date' => $passengerData['passport_issue_date'] ?? null,
                    'passport_expiry_date' => $passengerData['passport_expiry_date'] ?? null,
                    'visa_number' => $passengerData['visa_number'] ?? null,
                    'price_category' => $passengerData['price_category'] ?? null,
                    'price_amount' => $passengerData['price_amount'] ?? null,
                    'room_type' => $passengerData['room_type'] ?? null,
                    'room_number' => $passengerData['room_number'] ?? null,
                    'note' => $passengerData['note'] ?? null,
                ];

                if (! empty($passengerData['id'])) {
                    BookingPassenger::query()
                        ->where('id', $passengerData['id'])
                        ->where('booking_id', $booking->id)
                        ->update($payload);

                    continue;
                }

                $booking->passengers()->create($payload);
            }

            if (array_key_exists('rooms', $validated)) {
                $booking->rooms()->delete();
                $booking->rooms()->createMany($validated['rooms'] ?? []);
            }

            if (array_key_exists('addons', $validated)) {
                $booking->addons()->delete();
                $booking->addons()->createMany($validated['addons'] ?? []);
            }
        });

        return back()->with('success', 'Booking updated successfully.');
    }

    /**
     * Shared method to load booking data with all required relationships
     * and supplemental data (tourPrices, addOns) for the wizard view.
     */
    private function renderBookingPage(Company $company, Booking $booking, string $page): Response
    {
        $booking->load([
            'tour',
            'tour.company.companySetting',
            'vendor:id,name,payment_mode,commission',
            'agent:id,name',
            'user:id,name',
            'passengers',
            'rooms',
            'addons',
        ]);

        $tour = $booking->tour;

        $tourPrices = collect();
        $addOns = [];

        if ($tour) {
            $schedule = \App\Models\TourSchedule::where('tour_code', $tour->code)
                ->whereDate('departure_date', $booking->departure_date)
                ->first();

            $tourPrices = TourPrice::with('priceCategory:id,name,description')
                ->where('tour_code', $tour->code)
                ->when($schedule, function ($query) use ($schedule) {
                    $query->where('schedule_id', $schedule->id);
                })
                ->get()
                ->unique('price_category_id')
                ->map(function ($price) {
                    return [
                        'tourPriceId' => $price->id,
                        'categoryName' => $price->priceCategory?->name ?? 'Single',
                        'description' => $price->priceCategory?->description ?? '',
                        'price' => (float) $price->price,
                    ];
                })
                ->values();

            if ($schedule) {
                $bookingAddOns = $booking->addons
                    ->keyBy(fn ($addon) => strtolower((string) $addon->name));

                $addOns = \App\Models\TourAddOn::where('schedule_id', $schedule->id)
                    ->where('tour_id', $tour->id)
                    ->get()
                    ->map(function ($addon) use ($bookingAddOns) {
                        $savedAddon = $bookingAddOns->get(strtolower((string) $addon->description));
                        $unitPrice = (float) $addon->price;

                        return [
                            'key' => 'addon_'.$addon->id,
                            'label' => $addon->description,
                            'unitPrice' => $unitPrice,
                            'qty' => $savedAddon
                                ? (int) max(1, round((float) $savedAddon->price / max($unitPrice, 1)))
                                : ($addon->edit_status ? 0 : 1),
                            'hasQty' => (bool) $addon->edit_status,
                        ];
                    })
                    ->values()
                    ->toArray();

                $knownAddOnLabels = collect($addOns)
                    ->pluck('label')
                    ->map(fn ($label) => strtolower((string) $label))
                    ->all();

                foreach ($booking->addons as $bookingAddon) {
                    if (in_array(strtolower((string) $bookingAddon->name), $knownAddOnLabels, true)) {
                        continue;
                    }

                    $addOns[] = [
                        'key' => 'booking_addon_'.$bookingAddon->id,
                        'label' => $bookingAddon->name,
                        'unitPrice' => (float) $bookingAddon->price,
                        'qty' => 1,
                        'hasQty' => true,
                    ];
                }
            }
        }

        return Inertia::render($page, [
            'booking' => $booking,
            'tourPrices' => $tourPrices,
            'addOns' => $addOns,
            'minimumDownPaymentPct' => (float) ($tour?->company?->companySetting?->minimum_down_payment ?? 50),
            'minimumVatPct' => (float) ($tour?->company?->companySetting?->minimum_vat ?? 11),
        ]);
    }

    private function resolveCommissionAmount(Booking $booking): float
    {
        $commissionAmount = (float) ($booking->commission_amount ?? 0);

        if ($commissionAmount > 0) {
            return $commissionAmount;
        }

        $schedule = TourSchedule::query()
            ->where('tour_id', $booking->tour_id)
            ->whereDate('departure_date', $booking->departure_date)
            ->first();

        if (! $schedule || ! $booking->tour) {
            return 0;
        }

        $tourPrice = TourPrice::query()
            ->where('tour_code', $booking->tour->code)
            ->where('schedule_id', $schedule->id)
            ->first();

        if (! $tourPrice) {
            return 0;
        }

        $paxCount = (int) $booking->pax_adult + (int) $booking->pax_child;

        if ((float) $tourPrice->commission > 0) {
            return (float) $tourPrice->commission * $paxCount;
        }

        if ((float) $tourPrice->commission_rate > 0) {
            return ((float) $tourPrice->commission_rate / 100)
                * (float) $tourPrice->price
                * $paxCount;
        }

        return 0;
    }
}
