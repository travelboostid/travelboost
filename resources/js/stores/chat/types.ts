export type ChatActor = {
    type: 'user' | 'company' | 'anonymous-user';
    id: number;
};

export type Attachment = {
    type: 'tour' | 'agent-tour';
    data: string;
};

export type RoomPagination = {
    nextCursor: string | null;
    isLoading: boolean;
    error: string | null;
    hasLoaded: boolean;
};

export type RoomsStatus = {
    isLoading: boolean;
    error: string | null;
    hasLoaded: boolean;
};
