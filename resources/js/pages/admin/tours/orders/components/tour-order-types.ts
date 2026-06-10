export type AdminTourOrderCompany = {
    id: number;
    name: string;
    username: string;
};

export type AdminTourOrderTour = {
    id: number;
    name: string;
    code: string;
};

export type AdminTourOrderRow = {
    id: number;
    booking_number: string;
    invoice_number?: string | null;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    contact_notes?: string | null;
    status: string;
    departure_date?: string | null;
    grand_total: number;
    paid_amount: number;
    pax_adult: number;
    pax_child: number;
    pax_infant: number;
    payment_mode?: string | null;
    created_at: string;
    vendor?: AdminTourOrderCompany | null;
    agent?: AdminTourOrderCompany | null;
    tour?: AdminTourOrderTour | null;
};

export type PaginatedTourOrders = {
    data: AdminTourOrderRow[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};
