export type NetworkPerson = {
    id: number;
    name?: string | null;
    email?: string | null;
    referral_code?: string | null;
    status?: string | null;
    user_status?: string | null;
    is_inactive?: boolean;
};

export type InvitedAffiliate = {
    id: number;
    name?: string | null;
    email?: string | null;
    referral_code?: string | null;
    status?: string | null;
    is_inactive?: boolean;
};

export type AdminAffiliateRow = {
    id: number;
    user_id: number;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    referral_code?: string | null;
    status?: string | null;
    user_status?: string | null;
    note?: string | null;
    is_inactive?: boolean;
    master_affiliate?: NetworkPerson | null;
    partner?: NetworkPerson | null;
    invited_agents_count: number;
    subscribed_agents_count: number;
    created_at?: string | null;
};

export type AdminMasterAffiliateRow = {
    id: number;
    user_id: number;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    referral_code?: string | null;
    status?: string | null;
    user_status?: string | null;
    note?: string | null;
    is_inactive?: boolean;
    partner?: NetworkPerson | null;
    invited_affiliates_count: number;
    invited_affiliates: InvitedAffiliate[];
    created_at?: string | null;
};

export type PaginatedAffiliates = {
    data: AdminAffiliateRow[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

export type PaginatedMasterAffiliates = {
    data: AdminMasterAffiliateRow[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};
