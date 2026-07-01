export type NetworkPerson = {
    id: number;
    name?: string | null;
    email?: string | null;
    referral_code?: string | null;
    status?: string | null;
    user_status?: string | null;
    is_inactive?: boolean;
};

export type AdminCompanyRow = {
    id: number;
    name: string;
    username: string;
    email: string;
    phone?: string | null;
    customer_service_phone?: string | null;
    address?: string | null;
    note?: string | null;
    allow_package_one_agents?: boolean;
    photo_id?: number | null;
    photo_url?: string | null;
    created_at?: string | null;
    subscription_status?: string | null;
    subscription_ends_at?: string | null;
    subscription_package?: string | null;
    affiliation?: {
        affiliator?: NetworkPerson | null;
        master_affiliate?: NetworkPerson | null;
        partner?: NetworkPerson | null;
    } | null;
};

export type PaginatedCompanies = {
    data: AdminCompanyRow[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};
