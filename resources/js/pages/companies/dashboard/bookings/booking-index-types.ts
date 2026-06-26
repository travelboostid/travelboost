// Shared types for the dashboard bookings index page.

type FollowupPayload = {
    state:
        | 'completed'
        | 'due'
        | 'overdue'
        | 'pending_approval'
        | 'credit'
        | 'incomplete'
        | 'not_applicable';
    label: string;
    amount_due?: number | null;
    missing_count?: number | null;
    deadline: string | null;
    days_remaining: number | null;
    is_overdue: boolean;
    action_url: string | null;
    action_label: string | null;
};

type FollowupSummary = {
    payment_overdue: number;
    payment_overdue_amount: number;
    payment_due_soon: number;
    payment_due_soon_amount: number;
    documents_incomplete: number;
    documents_due_soon: number;
};

type PaymentDetail = {
    method_label: string;
    receiver_label: string;
    amount: number;
    payment_date: string | null;
    booking_payment_type?: 'down_payment' | 'full_payment' | null;
    display_label?: string | null;
    receipt: {
        type: 'manual' | 'online';
        url?: string | null;
        provider?: string | null;
        method?: string | null;
        order_id?: string | null;
        transaction_id?: string | null;
        status?: string | null;
        raw?: Record<string, unknown> | null;
    } | null;
    receipt_group?: {
        title: string;
        detail: PaymentDetail;
    }[];
};

type DocumentDetail = {
    passenger_name: string;
    passport_file_url: string | null;
    visa_file_url: string | null;
    passport_file_name: string | null;
    visa_file_name: string | null;
};

type PaymentReviewItem = {
    id: number;
    provider: string | null;
    payment_method: string | null;
    status: string | null;
    payment_flow_stage: string | null;
    sender_bank_name: string | null;
    sender_account_number: string | null;
    transfer_amount: number;
    amount?: number;
    proof_path: string | null;
    proof_url: string | null;
    payment_type: string | null;
    payment_date: string | null;
    receipt?: PaymentDetail['receipt'];
};

type BookingResource = {
    id: number;
    booking_number: string;
    contact_name: string | null;
    status: string;
    reserved_type?: string | null;
    pax_adult: number;
    pax_child: number;
    pax_infant: number;
    total_price: string;
    grand_total: string;
    paid_amount: number;
    remaining_balance: number;
    remaining_balance_visible?: boolean;
    commission_amount: string | null;
    continue_booking_url?: string | null;
    document_detail?: DocumentDetail[];
    payment_receiver_type?: 'vendor' | 'agent' | null;
    payment_receiver_company_id?: number | null;
    invoice_options?: {
        type: 'vendor_to_customer' | 'vendor_to_agent' | 'agent_to_customer';
        label: string;
    }[];
    input_by?: {
        user_name: string;
        role_label: string;
        company_name?: string | null;
        created_at: string | null;
    } | null;
    payment_followup: FollowupPayload;
    document_followup: FollowupPayload;
    pending_action_request?: {
        id: number;
        target_action: 'cancel' | 'refund' | 'reschedule' | 'restore';
        status: string;
    } | null;
    can_cancel?: boolean;
    can_refund?: boolean;
    can_reschedule?: boolean;
    can_reactivate?: boolean;
    can_reorder?: boolean;
    proforma_invoice_available?: boolean;
    down_payment_detail: PaymentDetail | null;
    full_payment_detail: PaymentDetail | null;
    departure_date: string | null;
    was_rescheduled?: boolean;
    created_at: string;
    tour: { id: number; name: string } | null;
    vendor: { id: number; name: string } | null;
    agent: { id: number; name: string } | null;
    user: { id: number; name: string } | null;
    payment_workflow?: {
        mode: 'direct' | 'agent_collection';
        stage:
            | 'direct_payment'
            | 'customer_payment_due'
            | 'customer_review'
            | 'agent_vendor_payment_due'
            | 'vendor_review'
            | 'complete'
            | 'closed';
        customer_payment: PaymentReviewItem | null;
        agent_vendor_payment: PaymentReviewItem | null;
        can_review_customer_payment: boolean;
        can_pay_vendor: boolean;
        can_review_agent_vendor_payment: boolean;
        vendor_bank_info?: {
            bankName: string;
            accountName: string;
            accountNumber: string;
        } | null;
    };
    can_review_manual_payment?: boolean;
    can_review_payment?: boolean;
    manual_payment:
        | (PaymentReviewItem & {
              id: number;
              customer_payment?: PaymentReviewItem | null;
              agent_vendor_payment?: PaymentReviewItem | null;
          })
        | null;
};

type PageProps = {
    data: {
        data: BookingResource[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
        from: number | null;
        to: number | null;
        links: { url: string | null; label: string; active: boolean }[];
    };
    followupSummary?: FollowupSummary;
    filters?: {
        search: string;
        status: string;
    };
};

export type {
    BookingResource,
    DocumentDetail,
    FollowupPayload,
    FollowupSummary,
    PageProps,
    PaymentDetail,
    PaymentReviewItem,
};
