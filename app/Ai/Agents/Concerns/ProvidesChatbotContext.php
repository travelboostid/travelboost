<?php

namespace App\Ai\Agents\Concerns;

use App\Actions\Booking\ReleaseCustomerBookingHoldAction;
use App\Actions\Booking\ReorderCustomerBookingAction;
use App\Actions\Booking\ReserveCustomerBookingAction;
use App\Enums\BookingStatus;
use App\Enums\CompanyType;
use App\Enums\TourStatus;
use App\Events\ChatMessageUpdated;
use App\Events\ChatRoomUpdated;
use App\Models\AiCredit;
use App\Models\AiUsageLog;
use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\ChatMessage;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\CompanySettings;
use App\Models\KnowledgeBase;
use App\Models\Media;
use App\Models\Tour;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use App\Models\TourWaitingListSchedule;
use App\Models\User;
use App\Services\BookingAddOnOptionsService;
use App\Services\BookingNumberService;
use App\Services\BookingPricingService;
use App\Services\TourScheduleDisplayPriceService;
use App\Support\NumericStringConfig;
use App\Support\TenantCustomerGuard;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Ai\Embeddings;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Messages\MessageRole;
use Laravel\Ai\Responses\AgentResponse;
use Laravel\Ai\Responses\EmbeddingsResponse;

trait ProvidesChatbotContext
{
    public const CHATBOT_CONFIG_CACHE_KEY = 'app_config.chatbot.value';

    private const CHATBOT_CONFIG_CACHE_SECONDS = 300;

    private const RECENT_MESSAGE_LIMIT = 4;

    private const SUMMARIZE_BATCH_MIN_MESSAGES = 2;

    private const SUMMARY_TRANSCRIPT_CHAR_LIMIT = 200;

    private const TOUR_QUERY_RESULT_LIMIT = 3;

    private const KNOWLEDGE_BASE_RESULT_LIMIT = 2;

    private const BOOKING_QUERY_RESULT_LIMIT = 5;

    private const TOUR_SCHEDULE_QUERY_RESULT_LIMIT = 8;

    private const KNOWLEDGE_BASE_CHUNK_MAX_CHARS = 400;

    private const AI_MESSAGE_MAX_CHARS = 500;

    private const BOT_CONTEXT_MAX_STORE_CHARS = 1500;

    private const VECTOR_MIN_SIMILARITY = 0.1;

    private const STREAM_BROADCAST_INTERVAL_SECONDS = 0.15;

    protected bool $shouldRespond = false;

    protected ?ChatRoomMember $receiver = null;

    protected ?Company $company = null;

    protected ?AiCredit $credit = null;

    protected ?CompanySettings $settings = null;

    protected Collection $chatMessages;

    protected ?Collection $generalKnowledgeBaseOwnerIds = null;

    protected string $chatbotModelProvider = '';

    protected string $chatbotModelName = '';

    protected string $embeddingModelProvider = '';

    protected string $embeddingModelName = '';

    protected int $promptTokens = 0;

    protected int $completionTokens = 0;

    protected int $embeddingTokens = 0;

    protected string $promptTokenCostPerMillion = '0';

    protected string $completionTokenCostPerMillion = '0';

    protected string $embeddingTokenCostPerMillion = '0';

    protected string $userCostPerInteraction = '0';

    /** @var list<array{label: string, href: string}> */
    protected array $botMessageActions = [];

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveTourQueryContext(array $args): string
    {
        $keywords = trim((string) ($args['keywords'] ?? ''));
        $destination = trim((string) ($args['destination'] ?? ''));
        $tourCode = trim((string) ($args['tour_code'] ?? ''));

        $tours = $this->availableToursQuery()
            ->when(($args['tour_id'] ?? 0) > 0, fn (Builder $query) => $query->whereKey($args['tour_id']))
            ->when($tourCode !== '', fn (Builder $query) => $query->where('code', 'ilike', $this->ilikeTerm($tourCode)))
            ->when($destination !== '', fn (Builder $query) => $query->where('destination', 'ilike', $this->ilikeTerm($destination)))
            ->when(! empty($args['continents'] ?? []), fn (Builder $query) => $this->applyIlikeLocationFilter($query, 'continent_name', (array) $args['continents']))
            ->when(! empty($args['countries'] ?? []), fn (Builder $query) => $this->applyIlikeLocationFilter($query, 'country_name', (array) $args['countries']))
            ->when(! empty($args['regions'] ?? []), fn (Builder $query) => $this->applyIlikeLocationFilter($query, 'region_name', (array) $args['regions']))
            ->when(($args['duration_min'] ?? 0) > 0, fn (Builder $query) => $query->where('duration_days', '>=', (int) $args['duration_min']))
            ->when(($args['duration_max'] ?? 0) > 0, fn (Builder $query) => $query->where('duration_days', '<=', (int) $args['duration_max']))
            ->when(($args['price_min'] ?? 0) > 0, fn (Builder $query) => $query->where('showprice', '>=', $args['price_min']))
            ->when(($args['price_max'] ?? 0) > 0, fn (Builder $query) => $query->where('showprice', '<=', $args['price_max']))
            ->when($keywords !== '', fn (Builder $query) => $this->applyTourKeywordsFilter($query, $keywords))
            ->orderBy('name')
            ->limit(self::TOUR_QUERY_RESULT_LIMIT)
            ->get();

        if ($tours->isEmpty()) {
            return 'No tours matched.';
        }

        return "tours:id|code|name|days|dest|country|price\n".$tours
            ->map(fn (Tour $tour): string => implode('|', [
                $tour->id,
                $tour->code,
                $tour->name,
                $tour->duration_days,
                $tour->destination,
                $tour->country_name,
                $tour->showprice,
            ]))
            ->implode("\n");
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveTourDetailContext(array $args): string
    {
        $tourId = $args['tour_id'] ?? null;

        if (! $tourId && $this->message->attachment_type === 'tour') {
            $tourId = (int) $this->message->attachment_data;
        }

        $tour = Tour::query()->find($tourId);
        if (! $tour) {
            return '';
        }

        $ownerIds = collect();

        if ($tour->document_id) {
            $ownerIds = collect([$tour->document_id]);
        }

        $documentRows = $ownerIds->isNotEmpty()
            ? $this->searchKnowledgeBase($ownerIds, $tour->name)
            : '';

        $knowledge = $documentRows !== '' ? "\nkb:\n{$documentRows}" : '';

        return 'tour:id|code|name|days|dest|country|price'
            ."\n".implode('|', [
                $tour->id,
                $tour->code,
                $tour->name,
                $tour->duration_days,
                $tour->destination,
                $tour->country_name,
                $tour->showprice,
            ])
            .$knowledge;
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveTourSchedulesContext(array $args): string
    {
        $tourId = $args['tour_id'] ?? null;

        if (! $tourId && $this->message->attachment_type === 'tour') {
            $tourId = (int) $this->message->attachment_data;
        }

        if (! $tourId) {
            return '';
        }

        $tour = $this->availableToursQuery()->whereKey($tourId)->first();

        if (! $tour) {
            return 'No tour matched.';
        }

        $upcomingOnly = filter_var($args['upcoming_only'] ?? true, FILTER_VALIDATE_BOOL);
        $departureFrom = trim((string) ($args['departure_from'] ?? ''));
        $departureTo = trim((string) ($args['departure_to'] ?? ''));

        $schedules = TourSchedule::query()
            ->where('tour_id', $tour->id)
            ->where('is_active', true)
            ->when($upcomingOnly, fn (Builder $query) => $query->whereDate('departure_date', '>=', now()->toDateString()))
            ->when($departureFrom !== '', fn (Builder $query) => $query->whereDate('departure_date', '>=', $departureFrom))
            ->when($departureTo !== '', fn (Builder $query) => $query->whereDate('departure_date', '<=', $departureTo))
            ->with(['availability', 'prices.priceCategory'])
            ->orderBy('departure_date')
            ->orderBy('id')
            ->limit(self::TOUR_SCHEDULE_QUERY_RESULT_LIMIT)
            ->get();

        if ($schedules->isEmpty()) {
            return 'No schedules matched.';
        }

        $priceService = app(TourScheduleDisplayPriceService::class);

        $header = "tour:{$tour->id}|{$tour->code}|{$tour->name}\n"
            ."schedules:id|departure|return|available|price\n";

        $rows = $schedules
            ->map(fn (TourSchedule $schedule): string => implode('|', [
                $schedule->id,
                $schedule->departure_date,
                $schedule->return_date ?? '',
                $schedule->availability?->available ?? '',
                $priceService->resolve($schedule, $tour),
            ]))
            ->implode("\n");

        return $header.$rows;
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveBookingQueryContext(array $args): string
    {
        if (! $this->chatAuthorizedCustomerUser()) {
            return $this->chatCustomerBookingDeniedMessage();
        }

        $tourId = $args['tour_id'] ?? null;

        if (! $tourId && $this->message->attachment_type === 'tour') {
            $tourId = (int) $this->message->attachment_data;
        }

        $keywords = trim((string) ($args['keywords'] ?? ''));
        $bookingNumber = trim((string) ($args['booking_number'] ?? ''));
        $statuses = $this->normalizeBookingStatusFilters((array) ($args['statuses'] ?? []));
        $upcomingOnly = filter_var($args['upcoming_only'] ?? false, FILTER_VALIDATE_BOOL);

        $bookings = TenantCustomerGuard::scopeBookingsForCompany(
            Booking::query()
                ->with('tour')
                ->where('user_id', $this->message->sender_id),
            $this->company,
        )
            ->when(($tourId ?? 0) > 0, fn (Builder $query) => $query->where('tour_id', $tourId))
            ->when($bookingNumber !== '', fn (Builder $query) => $query->where('booking_number', 'ilike', $this->ilikeTerm($bookingNumber)))
            ->when($statuses !== [], fn (Builder $query) => $query->whereIn('status', $statuses))
            ->when(! empty($args['departure_from'] ?? null), fn (Builder $query) => $query->whereDate('departure_date', '>=', $args['departure_from']))
            ->when(! empty($args['departure_to'] ?? null), fn (Builder $query) => $query->whereDate('departure_date', '<=', $args['departure_to']))
            ->when($upcomingOnly, fn (Builder $query) => $query->whereDate('departure_date', '>=', now()->toDateString()))
            ->when($keywords !== '', fn (Builder $query) => $this->applyBookingKeywordsFilter($query, $keywords))
            ->orderByDesc('departure_date')
            ->orderByDesc('id')
            ->limit(self::BOOKING_QUERY_RESULT_LIMIT)
            ->get();

        if ($bookings->isEmpty()) {
            return 'No bookings matched.';
        }

        return "bookings:id|no|tour|departure|status|total|can_reorder|can_release_hold\n".$bookings
            ->map(fn (Booking $booking): string => implode('|', [
                $booking->id,
                $booking->booking_number,
                $booking->tour?->name ?? '',
                $booking->departure_date,
                $this->formatBookingStatus($booking),
                $booking->total_price,
                $this->bookingCanBeReordered($booking) ? '1' : '0',
                $this->bookingCanReleaseHold($booking) ? '1' : '0',
            ]))
            ->implode("\n");
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveBookingDetailContext(array $args): string
    {
        if (! $this->chatAuthorizedCustomerUser()) {
            return $this->chatCustomerBookingDeniedMessage();
        }

        $booking = $this->findCustomerBooking($args);

        if (! $booking) {
            return 'No booking matched.';
        }

        return 'booking:id|no|tour|departure|status|total|adult|child|infant|contact|email|can_reorder|can_release_hold'
            ."\n".implode('|', [
                $booking->id,
                $booking->booking_number,
                $booking->tour?->name ?? '',
                $booking->departure_date,
                $this->formatBookingStatus($booking),
                $booking->total_price,
                $booking->pax_adult,
                $booking->pax_child,
                $booking->pax_infant,
                $booking->contact_name,
                $booking->contact_email,
                $this->bookingCanBeReordered($booking) ? '1' : '0',
                $this->bookingCanReleaseHold($booking) ? '1' : '0',
            ]);
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function reorderExpiredBookingContext(array $args): string
    {
        $user = $this->chatAuthorizedCustomerUser();

        if (! $user) {
            return $this->chatCustomerBookingDeniedMessage();
        }

        $booking = $this->findCustomerBooking($args);

        if (! $booking) {
            return 'No booking matched.';
        }

        if (! $this->bookingCanBeReordered($booking) && ! $this->bookingCanBeContinued($booking)) {
            return 'reorder_unavailable:Booking cannot be reordered. It may not be expired, the departure may have passed, or the booking window is closed.';
        }

        try {
            $result = app(ReorderCustomerBookingAction::class)->execute($user, $booking, $this->company);
            $booking = $result['booking'];
            $continueUrl = $result['continue_url'];
            $myBookingsUrl = '/mybookings?tab=current&booking_number='.urlencode((string) $booking->booking_number);

            $this->appendBotMessageAction([
                'label' => 'Continue booking',
                'href' => $continueUrl,
            ]);

            $this->appendBotMessageAction([
                'label' => 'View my booking',
                'href' => $myBookingsUrl,
            ]);

            return 'reordered:status|booking_number|tour|departure|new_status|continue_url|mybookings_url'
                ."\n".implode('|', [
                    $result['reactivated'] ? 'reactivated' : 'continued',
                    $booking->booking_number,
                    $booking->tour?->name ?? '',
                    $booking->departure_date,
                    $this->formatBookingStatus($booking),
                    $continueUrl,
                    $myBookingsUrl,
                ])
                ."\nTell the customer they can continue their booking from the button below.";
        } catch (ValidationException $exception) {
            $messages = collect($exception->errors())->flatten()->implode(' ');

            return 'reorder_failed:'.$messages;
        } catch (\Throwable $exception) {
            return 'reorder_failed:'.$exception->getMessage();
        }
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function releaseBookingHoldContext(array $args): string
    {
        $user = $this->chatAuthorizedCustomerUser();

        if (! $user) {
            return $this->chatCustomerBookingDeniedMessage();
        }

        $booking = $this->findCustomerBooking($args);

        if (! $booking) {
            return 'No booking matched.';
        }

        if (! $this->bookingCanReleaseHold($booking)) {
            return 'release_unavailable:This booking has no active system hold to release. It may already be expired, awaiting payment, or a waiting-list offer.';
        }

        try {
            $result = app(ReleaseCustomerBookingHoldAction::class)->execute($user, $booking, $this->company);
            $booking = $result['booking'];
            $myBookingsUrl = '/mybookings?tab=current&booking_number='.urlencode((string) $booking->booking_number);

            if ($result['released']) {
                $this->appendBotMessageAction([
                    'label' => 'View my bookings',
                    'href' => $myBookingsUrl,
                ]);

                return 'hold_released:booking_number|tour|departure|new_status|mybookings_url'
                    ."\n".implode('|', [
                        $booking->booking_number,
                        $booking->tour?->name ?? '',
                        $booking->departure_date,
                        $this->formatBookingStatus($booking),
                        $myBookingsUrl,
                    ])
                    ."\nTell the customer their hold was released and seats are available again.";
            }

            return 'hold_unchanged:Booking was not on an active timed hold. Status remains '.$this->formatBookingStatus($booking).'.';
        } catch (ValidationException $exception) {
            $messages = collect($exception->errors())->flatten()->implode(' ');

            return 'release_failed:'.$messages;
        } catch (\Throwable $exception) {
            return 'release_failed:'.$exception->getMessage();
        }
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveGeneralContext(array $args): string
    {
        $query = trim((string) ($args['query'] ?? ''));
        if ($query === '') {
            $query = $this->message->message;
        }

        $ownerIds = $this->generalKnowledgeBaseOwnerIds();

        $tourId = (int) ($args['tour_id'] ?? 0);
        if ($tourId <= 0 && $this->message->attachment_type === 'tour') {
            $tourId = (int) $this->message->attachment_data;
        }

        if ($tourId > 0) {
            $tour = Tour::query()->find($tourId);

            if ($tour?->document_id) {
                $ownerIds = $ownerIds->prepend($tour->document_id)->unique()->values();
            }
        }

        if ($ownerIds->isEmpty()) {
            return 'No knowledge base documents available.';
        }

        $results = $this->searchKnowledgeBase($ownerIds, $query);

        return $results !== '' ? $results : 'No knowledge base entries matched.';
    }

    public function retrieveCompanyContactContext(): string
    {
        if (! $this->company) {
            return '';
        }

        $csPhone = $this->company->customer_service_phone ?: $this->company->phone;

        return 'company:name|email|address|cs_phone'
            ."\n".implode('|', [
                $this->company->name,
                $this->company->email,
                $this->company->address,
                $csPhone,
            ]);
    }

    public function retrieveCustomerProfileContext(): string
    {
        $user = $this->chatAuthorizedCustomerUser();

        if (! $user) {
            return $this->chatCustomerBookingDeniedMessage();
        }

        return 'customer:id|name|username|email|phone'
            ."\n".implode('|', [
                $user->id,
                $user->name,
                $user->username ?? '',
                $user->email,
                $user->phone ?? '',
            ]);
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function retrieveBookingQuoteContext(array $args): string
    {
        $user = $this->chatAuthorizedCustomerUser();

        if (! $user) {
            return $this->chatCustomerBookingDeniedMessage();
        }

        $tourId = (int) ($args['tour_id'] ?? 0);

        if ($tourId <= 0 && $this->message->attachment_type === 'tour') {
            $tourId = (int) $this->message->attachment_data;
        }

        if ($tourId <= 0) {
            return 'Missing tour_id.';
        }

        $tour = $this->availableToursQuery()->whereKey($tourId)->first();

        if (! $tour) {
            return 'No tour matched.';
        }

        $departureDate = trim((string) ($args['departure_date'] ?? ''));

        if ($departureDate === '') {
            return 'Missing departure_date. Use get_tour_schedules first.';
        }

        $schedule = TourSchedule::query()
            ->where('tour_id', $tour->id)
            ->where('company_id', $tour->company_id)
            ->where('is_active', true)
            ->whereDate('departure_date', $departureDate)
            ->first();

        if (! $schedule) {
            return 'No active schedule for that departure date.';
        }

        $priceCategories = TourPrice::query()
            ->with('priceCategory')
            ->where('company_id', $tour->company_id)
            ->where('tour_code', $tour->code)
            ->where('schedule_id', $schedule->id)
            ->orderBy('id')
            ->get()
            ->unique('price_category_id');

        $categoryRows = $priceCategories
            ->map(fn (TourPrice $price): string => implode('|', [
                $price->priceCategory?->name ?? 'Unknown',
                $price->price,
                $price->priceCategory?->description ?? '',
            ]))
            ->implode("\n");

        $addOnRows = collect(app(BookingAddOnOptionsService::class)->forSchedule($tour, $schedule))
            ->map(fn (array $addon): string => implode('|', [
                $addon['label'],
                $addon['unitPrice'],
                $addon['isTaxable'] ? '1' : '0',
                $addon['hasQty'] ? '1' : '0',
            ]))
            ->implode("\n");

        $passengers = $this->decodeJsonArray($args['passengers_json'] ?? $args['passengers'] ?? []);

        if ($passengers === []) {
            return "quote_requirements:tour_id|departure_date|passengers_json|contact\n"
                ."passengers_json must be a JSON array. Each passenger needs first_name, price_category, and optionally title, last_name, dob, pob, room_type, price_amount.\n"
                ."price_categories:category|price|description\n"
                .($categoryRows !== '' ? $categoryRows : 'No price categories found.')
                ."\naddons:label|unit_price|is_taxable|has_qty\n"
                .($addOnRows !== '' ? $addOnRows : 'No add-ons.');
        }

        $addons = $this->decodeJsonArray($args['addons_json'] ?? $args['addons'] ?? []);
        $agentId = $this->resolveChatbotAgentId();

        $quote = app(BookingPricingService::class)->quoteForBookingData(
            $tour,
            $departureDate,
            $passengers,
            $addons,
            (float) ($tour->company?->companySetting?->minimum_vat ?? BookingPricingService::DEFAULT_PPN_RATE),
            $agentId !== null,
            $agentId,
        );

        return 'quote:subtotal|tax|platform_fee|commission|grand_total|pax_adult|pax_child|pax_infant'
            ."\n".implode('|', [
                $quote['subtotal_guests'],
                $quote['tax_amount'] ?? 0,
                $quote['platform_fee'] ?? 0,
                $quote['agent_commission'] ?? 0,
                $quote['grand_total'] ?? 0,
                $this->countPassengersByType($passengers, 'adult'),
                $this->countPassengersByType($passengers, 'child'),
                $this->countPassengersByType($passengers, 'infant'),
            ])
            ."\nrequired_for_reserve:contact_name|contact_email|contact_phone|passengers_json|departure_date|tour_id";
    }

    /**
     * @param  array<string, mixed>  $args
     */
    public function reserveBookingContext(array $args): string
    {
        $user = $this->chatAuthorizedCustomerUser();

        if (! $user) {
            return $this->chatCustomerBookingDeniedMessage();
        }

        try {
            $payload = $this->buildChatbotReservePayload($args, $user);
            $tour = $this->availableToursQuery()->whereKey($payload['tour_id'])->first();

            if (! $tour) {
                return 'No tour matched.';
            }

            $booking = app(ReserveCustomerBookingAction::class)->execute($user, $tour, $payload, $this->company);

            $myBookingsUrl = '/mybookings?tab=current&booking_number='.urlencode((string) $booking->booking_number);

            $this->appendBotMessageAction([
                'label' => 'View my booking',
                'href' => $myBookingsUrl,
            ]);

            return 'reserved:booking_number|tour|departure|grand_total|expires_minutes|mybookings_url'
                ."\n".implode('|', [
                    $booking->booking_number,
                    $booking->tour?->name ?? '',
                    $booking->departure_date,
                    $booking->grand_total,
                    max(1, (int) now()->diffInMinutes($booking->reserved_expires_at, false)),
                    $myBookingsUrl,
                ])
                ."\nTell the customer their booking is reserved and they can continue payment from My Bookings.";
        } catch (ValidationException $exception) {
            $messages = collect($exception->errors())->flatten()->implode(' ');

            return 'reserve_failed:'.$messages;
        } catch (\Throwable $exception) {
            return 'reserve_failed:'.$exception->getMessage();
        }
    }

    /**
     * @param  array{label: string, href: string}  $action
     */
    protected function appendBotMessageAction(array $action): void
    {
        $this->botMessageActions[] = $action;
    }

    protected function setupChatbotContext(): void
    {
        if (! $this->loadChatbotConfig()) {
            return;
        }

        if ($this->message->is_bot || $this->message->room->type !== 'private') {
            return;
        }

        if (! $this->resolveCompanyContext()) {
            return;
        }

        if (! $this->hasSufficientCredit()) {
            return;
        }

        $this->settings = $this->company->settings;

        if (! $this->settings?->chatbot_enabled) {
            return;
        }

        $this->refreshConversationSummaryIfNeeded();

        $this->chatMessages = $this->message->room->messages()
            ->where('id', '<=', $this->message->id)
            ->latest()
            ->take(self::RECENT_MESSAGE_LIMIT)
            ->get()
            ->filter(fn (ChatMessage $message): bool => ! $message->is_bot || trim((string) $message->message) !== '')
            ->reverse()
            ->values();

        $this->shouldRespond = true;
    }

    protected function createBotPlaceholderMessage(): ChatMessage
    {
        $botMessage = ChatMessage::query()->create([
            'room_id' => $this->message->room_id,
            'sender_type' => 'company',
            'sender_id' => $this->company->id,
            'message' => '',
            'is_bot' => true,
            'meta' => ['streaming' => true],
        ]);

        return $botMessage->load(['sender', 'room']);
    }

    protected function updateStreamingBotMessage(ChatMessage $message, string $text, bool $streaming): ChatMessage
    {
        $meta = array_merge($message->meta ?? [], ['streaming' => $streaming]);

        $message->update([
            'message' => $text,
            'meta' => $meta,
        ]);

        return $message->fresh(['sender', 'room']);
    }

    protected function finalizeStreamingBotMessage(
        ChatMessage $message,
        string $text,
        ?string $botContext = null,
    ): ChatMessage {
        $meta = array_merge($message->meta ?? [], ['streaming' => false]);

        if ($botContext !== null && $botContext !== '') {
            $meta['bot-context'] = $this->truncateForModel($botContext, self::BOT_CONTEXT_MAX_STORE_CHARS);
        }

        if ($this->botMessageActions !== []) {
            $meta['actions'] = $this->botMessageActions;
            $this->botMessageActions = [];
        }

        $message->update([
            'message' => $text,
            'meta' => $meta,
        ]);

        $fresh = $message->fresh(['sender', 'room']);

        $this->broadcastBotMessageUpdate($fresh);
        $this->updateChatRoomLastMessage($fresh);

        return $fresh;
    }

    protected function updateChatRoomLastMessage(ChatMessage $message): void
    {
        $message->room()->update(['last_message_id' => $message->id]);

        $room = $message->room()->with(['lastMessage', 'members'])->first();

        if ($room !== null) {
            broadcast(new ChatRoomUpdated($room));
        }
    }

    protected function broadcastBotMessageUpdate(ChatMessage $message): void
    {
        broadcast(new ChatMessageUpdated($message->loadMissing(['sender', 'room'])));
    }

    protected function saveUsageLog(): bool
    {
        $usageCost = $this->getUsageCost();
        $userCost = $this->userCostPerInteraction;

        return (bool) DB::transaction(function () use ($userCost, $usageCost): bool {
            $credit = AiCredit::query()
                ->whereKey($this->credit->id)
                ->lockForUpdate()
                ->first();

            if (! $credit || bccomp((string) $credit->balance, $userCost, 10) < 0) {
                return false;
            }

            $credit->decrement('balance', $userCost);

            AiUsageLog::query()->create([
                'company_id' => $this->company->id,
                'embedding_tokens' => $this->embeddingTokens,
                'prompt_tokens' => $this->promptTokens,
                'completion_tokens' => $this->completionTokens,
                'usage_cost' => $usageCost,
                'user_cost' => $userCost,
                'feature' => 'chatbot',
                'meta' => [
                    'chat_message_id' => $this->message->id,
                    'room_id' => $this->message->room_id,
                ],
            ]);

            return true;
        });
    }

    protected function trackTokenUsage(EmbeddingsResponse|AgentResponse $response): void
    {
        if ($response instanceof EmbeddingsResponse) {
            $this->embeddingTokens += $response->tokens ?? 0;

            return;
        }

        $usage = $response->usage;

        $this->promptTokens += ($usage->promptTokens ?? 0) + ($usage->cacheReadInputTokens ?? 0);
        $this->completionTokens += ($usage->completionTokens ?? 0)
            + ($usage->reasoningTokens ?? 0)
            + ($usage->cacheWriteInputTokens ?? 0);
    }

    protected function hasConfiguredModels(): bool
    {
        return $this->chatbotModelProvider !== ''
            && $this->chatbotModelName !== ''
            && $this->embeddingModelProvider !== ''
            && $this->embeddingModelName !== '';
    }

    protected function toAiMessage(ChatMessage $chatMessage, bool $includeBotContext = false): Message
    {
        $content = $this->truncateForModel(trim((string) $chatMessage->message));

        if ($chatMessage->attachment_type === 'tour' && $chatMessage->attachment_data) {
            $content .= "\n[Attached tour_id: {$chatMessage->attachment_data}]";
        }

        if ($includeBotContext) {
            $context = data_get($chatMessage->meta, 'bot-context');
            if (is_string($context) && $context !== '') {
                $content .= "\n---\nAdditional context:\n".$this->truncateForModel($context, self::BOT_CONTEXT_MAX_STORE_CHARS);
            }
        }

        return new Message(
            $chatMessage->is_bot ? MessageRole::Assistant : MessageRole::User,
            $content,
        );
    }

    protected function truncateForModel(string $text, ?int $maxChars = null): string
    {
        $maxChars ??= self::AI_MESSAGE_MAX_CHARS;

        if ($maxChars <= 0 || mb_strlen($text) <= $maxChars) {
            return $text;
        }

        return rtrim(mb_substr($text, 0, max(0, $maxChars - 1))).'…';
    }

    /**
     * @return Builder<Tour>
     */
    private function availableToursQuery(): Builder
    {
        $query = Tour::query()->where('status', TourStatus::ACTIVE);

        if ($this->company->type === CompanyType::AGENT) {
            $agentTourIds = $this->company->agentTours()
                ->where('status', TourStatus::ACTIVE)
                ->pluck('tour_id');

            return $query->where(function (Builder $query) use ($agentTourIds): void {
                $query->where('company_id', $this->company->id)
                    ->orWhereIn('id', $agentTourIds);
            });
        }

        return $query->where('company_id', $this->company->id);
    }

    /**
     * @param  Builder<Tour>  $query
     * @param  list<string>  $values
     */
    private function applyIlikeLocationFilter(Builder $query, string $column, array $values): void
    {
        $values = array_values(array_filter(array_map(
            fn (mixed $value): string => trim((string) $value),
            $values,
        )));

        if ($values === []) {
            return;
        }

        $query->where(function (Builder $query) use ($column, $values): void {
            foreach ($values as $value) {
                $query->orWhere($column, 'ilike', $this->ilikeTerm($value));
            }
        });
    }

    /**
     * @param  Builder<Tour>  $query
     */
    private function applyTourKeywordsFilter(Builder $query, string $keywords): void
    {
        $tokens = preg_split('/\s+/u', $keywords, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        foreach ($tokens as $token) {
            $term = $this->ilikeTerm($token);

            $query->where(function (Builder $query) use ($term): void {
                $query->where('name', 'ilike', $term)
                    ->orWhere('code', 'ilike', $term)
                    ->orWhere('destination', 'ilike', $term)
                    ->orWhere('country_name', 'ilike', $term)
                    ->orWhere('region_name', 'ilike', $term)
                    ->orWhere('continent_name', 'ilike', $term)
                    ->orWhere('description', 'ilike', $term);
            });
        }
    }

    /**
     * @param  Builder<Booking>  $query
     */
    private function applyBookingKeywordsFilter(Builder $query, string $keywords): void
    {
        $tokens = preg_split('/\s+/u', $keywords, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        foreach ($tokens as $token) {
            $term = $this->ilikeTerm($token);

            $query->where(function (Builder $query) use ($term): void {
                $query->where('booking_number', 'ilike', $term)
                    ->orWhereHas('tour', function (Builder $query) use ($term): void {
                        $query->where('name', 'ilike', $term)
                            ->orWhere('code', 'ilike', $term)
                            ->orWhere('destination', 'ilike', $term);
                    });
            });
        }
    }

    /**
     * @param  list<mixed>  $statuses
     * @return list<string>
     */
    private function normalizeBookingStatusFilters(array $statuses): array
    {
        $normalized = [];

        foreach ($statuses as $status) {
            $needle = strtolower(trim((string) $status));

            if ($needle === '') {
                continue;
            }

            foreach (BookingStatus::cases() as $case) {
                if (strtolower($case->value) === $needle) {
                    $normalized[] = $case->value;
                }
            }
        }

        return array_values(array_unique($normalized));
    }

    private function ilikeTerm(string $value): string
    {
        return '%'.addcslashes(trim($value), '%_\\').'%';
    }

    /**
     * @param  Collection<int, int|string>  $ownerIds
     */
    private function searchKnowledgeBase(Collection $ownerIds, string $query): string
    {
        if ($ownerIds->isEmpty()) {
            return '';
        }

        $embedded = Embeddings::for([$query])
            ->cache()
            ->generate(
                provider: $this->embeddingModelProvider,
                model: $this->embeddingModelName,
            );

        $this->trackTokenUsage($embedded);

        $vector = $embedded->embeddings[0] ?? null;
        if ($vector === null) {
            return '';
        }

        $documents = KnowledgeBase::query()
            ->whereVectorSimilarTo('embedding', $vector, minSimilarity: self::VECTOR_MIN_SIMILARITY)
            ->where('owner_type', Media::class)
            ->whereIn('owner_id', $ownerIds)
            ->limit(self::KNOWLEDGE_BASE_RESULT_LIMIT)
            ->pluck('content');

        if ($documents->isEmpty()) {
            return '';
        }

        return $documents
            ->map(fn (string $document): string => '- '.$this->truncateForModel(trim($document), self::KNOWLEDGE_BASE_CHUNK_MAX_CHARS))
            ->implode("\n");
    }

    /**
     * @return Collection<int, int>
     */
    private function generalKnowledgeBaseOwnerIds(): Collection
    {
        if ($this->generalKnowledgeBaseOwnerIds !== null) {
            return $this->generalKnowledgeBaseOwnerIds;
        }

        $this->generalKnowledgeBaseOwnerIds = Media::query()
            ->where('subtype', 'general-knowledge-base-document')
            ->pluck('id');

        return $this->generalKnowledgeBaseOwnerIds;
    }

    private function getUsageCost(): string
    {
        $promptTokenCost = bcmul(
            bcdiv((string) $this->promptTokens, '1000000', 16),
            $this->promptTokenCostPerMillion,
            16,
        );
        $completionTokenCost = bcmul(
            bcdiv((string) $this->completionTokens, '1000000', 16),
            $this->completionTokenCostPerMillion,
            16,
        );
        $embeddingTokenCost = bcmul(
            bcdiv((string) $this->embeddingTokens, '1000000', 16),
            $this->embeddingTokenCostPerMillion,
            16,
        );

        return bcadd(bcadd($promptTokenCost, $completionTokenCost, 16), $embeddingTokenCost, 16);
    }

    private function loadChatbotConfig(): bool
    {
        $config = Cache::remember(
            self::CHATBOT_CONFIG_CACHE_KEY,
            self::CHATBOT_CONFIG_CACHE_SECONDS,
            fn (): ?array => AppConfig::query()->where('key', 'chatbot')->value('value'),
        );

        if (! is_array($config)) {
            return false;
        }

        $this->chatbotModelProvider = (string) ($config['chatbot_model_provider'] ?? '');
        $this->chatbotModelName = (string) ($config['chatbot_model_name'] ?? '');
        $this->embeddingModelProvider = (string) ($config['embedding_model_provider'] ?? '');
        $this->embeddingModelName = (string) ($config['embedding_model_name'] ?? '');
        $this->promptTokenCostPerMillion = NumericStringConfig::normalize($config['prompt_token_cost_per_million'] ?? null);
        $this->completionTokenCostPerMillion = NumericStringConfig::normalize($config['completion_token_cost_per_million'] ?? null);
        $this->embeddingTokenCostPerMillion = NumericStringConfig::normalize($config['embedding_token_cost_per_million'] ?? null);
        $this->userCostPerInteraction = NumericStringConfig::normalize($config['user_cost_per_interaction'] ?? null);

        return true;
    }

    private function resolveCompanyContext(): bool
    {
        $members = $this->message->room->members;

        $sender = $members->first(
            fn (ChatRoomMember $member): bool => $member->member_id === $this->message->sender_id
                && $member->member_type === $this->message->sender_type,
        );

        $this->receiver = $members->first(
            fn (ChatRoomMember $member): bool => $member->id !== $sender?->id,
        );

        $member = $this->receiver?->member;
        $this->company = $this->receiver?->member_type === 'company' && $member instanceof Company
            ? $member
            : null;

        if (! $this->company) {
            return false;
        }

        $this->credit = $this->company->aiCredit()->first();

        return $this->credit !== null;
    }

    private function hasSufficientCredit(): bool
    {
        return bccomp((string) $this->credit->balance, $this->userCostPerInteraction, 10) >= 0;
    }

    private function formatBookingStatus(Booking $booking): string
    {
        $status = $booking->status;

        if ($status instanceof BookingStatus) {
            return $status->value;
        }

        return (string) ($status ?? '');
    }

    private function chatAuthorizedCustomerUser(): ?User
    {
        if ($this->message->sender_type !== 'user' || ! $this->company) {
            return null;
        }

        $user = User::query()->find($this->message->sender_id);

        if (! $user instanceof User) {
            return null;
        }

        if ((int) $user->company_id !== (int) $this->company->id) {
            return null;
        }

        if (! $user->hasRole('user:customer')) {
            return null;
        }

        return $user;
    }

    private function chatCustomerBookingDeniedMessage(): string
    {
        if ($this->message->sender_type !== 'user') {
            return 'Login required. Ask the customer to log in at /customers/login before continuing.';
        }

        $user = User::query()->find($this->message->sender_id);

        if ($user instanceof User && (int) $user->company_id !== (int) $this->company?->id) {
            return 'customer:wrong_agent|This account is not registered with this travel agent. Ask the customer to log in with their account for this agent at /customers/login.';
        }

        if ($user instanceof User && ! $user->hasRole('user:customer')) {
            return 'customer:not_customer|Only customer accounts can manage bookings in chat.';
        }

        return 'Login required. Ask the customer to log in at /customers/login before continuing.';
    }

    private function resolveChatbotAgentId(): ?int
    {
        if ($this->company?->type === CompanyType::AGENT) {
            return $this->company->id;
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $args
     * @return array<string, mixed>
     */
    private function buildChatbotReservePayload(array $args, User $user): array
    {
        $tourId = (int) ($args['tour_id'] ?? 0);

        if ($tourId <= 0 && $this->message->attachment_type === 'tour') {
            $tourId = (int) $this->message->attachment_data;
        }

        $passengers = $this->decodeJsonArray($args['passengers_json'] ?? $args['passengers'] ?? []);
        $addons = $this->decodeJsonArray($args['addons_json'] ?? $args['addons'] ?? []);

        $payload = [
            'tour_id' => $tourId,
            'departure_date' => trim((string) ($args['departure_date'] ?? '')),
            'pax_adult' => (int) ($args['pax_adult'] ?? $this->countPassengersByType($passengers, 'adult')),
            'pax_child' => (int) ($args['pax_child'] ?? $this->countPassengersByType($passengers, 'child')),
            'pax_infant' => (int) ($args['pax_infant'] ?? $this->countPassengersByType($passengers, 'infant')),
            'booking_number' => trim((string) ($args['booking_number'] ?? '')),
            'vendor_id' => isset($args['vendor_id']) ? (int) $args['vendor_id'] : null,
            'agent_id' => isset($args['agent_id']) ? (int) $args['agent_id'] : $this->resolveChatbotAgentId(),
            'contact_name' => trim((string) ($args['contact_name'] ?? $user->name ?? '')),
            'contact_email' => trim((string) ($args['contact_email'] ?? $user->email ?? '')),
            'contact_phone' => trim((string) ($args['contact_phone'] ?? $user->phone ?? '')),
            'contact_notes' => trim((string) ($args['contact_notes'] ?? '')),
            'passengers' => $passengers,
            'addons' => $addons,
        ];

        if ($payload['booking_number'] === '') {
            $payload['booking_number'] = app(BookingNumberService::class)->generate((string) ($this->company?->id ?? 0));
        }

        Validator::validate($payload, [
            'tour_id' => ['required', 'integer', 'exists:tours,id'],
            'departure_date' => ['required', 'date'],
            'pax_adult' => ['required', 'integer', 'min:0'],
            'pax_child' => ['required', 'integer', 'min:0'],
            'pax_infant' => ['required', 'integer', 'min:0'],
            'booking_number' => ['required', 'string'],
            'vendor_id' => ['nullable', 'exists:companies,id'],
            'agent_id' => ['nullable', 'exists:companies,id'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'contact_notes' => ['nullable', 'string', 'max:1000'],
            'addons' => ['nullable', 'array'],
            'addons.*.name' => ['required_with:addons', 'string', 'max:255'],
            'addons.*.price' => ['required_with:addons', 'numeric', 'min:0'],
            'addons.*.qty' => ['nullable', 'integer', 'min:0'],
            'addons.*.is_taxable' => ['nullable', 'boolean'],
            'passengers' => ['required', 'array', 'min:1'],
            'passengers.*.title' => ['nullable', 'string', 'max:20'],
            'passengers.*.first_name' => ['required', 'string', 'max:255'],
            'passengers.*.last_name' => ['nullable', 'string', 'max:255'],
            'passengers.*.dob' => ['nullable', 'date'],
            'passengers.*.pob' => ['nullable', 'string', 'max:255'],
            'passengers.*.price_category' => ['nullable', 'string'],
            'passengers.*.price_amount' => ['nullable', 'numeric'],
            'passengers.*.visa_category_item_id' => ['nullable', 'integer', 'exists:visa_category_items,id'],
            'passengers.*.room_type' => ['nullable', 'string'],
            'passengers.*.note' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! $payload['vendor_id']) {
            $tour = Tour::query()->find($payload['tour_id']);
            $payload['vendor_id'] = $tour?->company_id;
        }

        return $payload;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function decodeJsonArray(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }

        $json = trim((string) $value);

        if ($json === '') {
            return [];
        }

        $decoded = json_decode($json, true);

        return is_array($decoded) ? array_values($decoded) : [];
    }

    /**
     * @param  list<array<string, mixed>>  $passengers
     */
    private function countPassengersByType(array $passengers, string $type): int
    {
        return collect($passengers)
            ->filter(function (array $passenger) use ($type): bool {
                $category = strtolower((string) ($passenger['price_category'] ?? ''));

                return match ($type) {
                    'child' => str_contains($category, 'child'),
                    'infant' => str_contains($category, 'infant'),
                    default => ! str_contains($category, 'child') && ! str_contains($category, 'infant'),
                };
            })
            ->count();
    }

    /**
     * @param  array<string, mixed>  $args
     */
    private function findCustomerBooking(array $args): ?Booking
    {
        if (! $this->chatAuthorizedCustomerUser()) {
            return null;
        }

        $bookingId = (int) ($args['booking_id'] ?? 0);
        $bookingNumber = trim((string) ($args['booking_number'] ?? ''));

        $query = TenantCustomerGuard::scopeBookingsForCompany(
            Booking::query()
                ->with('tour.company.companySetting')
                ->where('user_id', $this->message->sender_id),
            $this->company,
        );

        if ($bookingId > 0) {
            return $query->whereKey($bookingId)->first();
        }

        if ($bookingNumber !== '') {
            return $query->where('booking_number', 'ilike', $this->ilikeTerm($bookingNumber))->first();
        }

        return null;
    }

    private function bookingCanBeReordered(Booking $booking): bool
    {
        $status = $booking->status instanceof BookingStatus
            ? $booking->status
            : BookingStatus::tryFrom((string) $booking->status);

        if ($status !== BookingStatus::EXPIRED) {
            return false;
        }

        return $this->bookingScheduleIsBookable($booking);
    }

    private function bookingCanBeContinued(Booking $booking): bool
    {
        $status = $booking->status instanceof BookingStatus
            ? $booking->status
            : BookingStatus::tryFrom((string) $booking->status);

        if (! in_array($status, [
            BookingStatus::AWAITING_PAYMENT,
            BookingStatus::BOOKING_RESERVED,
        ], true)) {
            return false;
        }

        return $this->bookingScheduleIsBookable($booking);
    }

    private function bookingCanReleaseHold(Booking $booking): bool
    {
        $status = $booking->status instanceof BookingStatus
            ? $booking->status
            : BookingStatus::tryFrom((string) $booking->status);

        if ($status !== BookingStatus::BOOKING_RESERVED || $booking->reserved_type !== 'system') {
            return false;
        }

        if ($booking->reserved_type === 'waiting_list_offer') {
            return false;
        }

        return ! TourWaitingListSchedule::query()
            ->where('booking_id', $booking->id)
            ->exists();
    }

    private function bookingScheduleIsBookable(Booking $booking): bool
    {
        if (! $booking->tour_id || ! $booking->vendor_id || ! $booking->departure_date) {
            return false;
        }

        $booking->loadMissing('tour.company.companySetting');
        $settings = $booking->tour?->company?->companySetting;

        $departureDate = Carbon::parse($booking->departure_date)->startOfDay();

        if ($departureDate->isPast() && ! $departureDate->isToday()) {
            return false;
        }

        $deadlineDays = (int) ($settings?->booking_deadline ?? 0);
        $cutoffDate = now()->startOfDay()->addDays($deadlineDays);

        if ($departureDate->lt($cutoffDate)) {
            return false;
        }

        return TourSchedule::query()
            ->where('tour_id', $booking->tour_id)
            ->where('company_id', $booking->vendor_id)
            ->where('is_active', true)
            ->whereDate('departure_date', $departureDate->toDateString())
            ->exists();
    }
}
