export interface User {
    id: number;
    username: string;
    email: string;
}

export interface Feed {
    id: number;
    title: string;
    description?: string;
    file_path: string;
    host_id: number;
    created_at: string;
    updated_at: string;
    host?: {
        username: string;
        email: string;
    };
    comment_count: number;
}

export interface SharedFeed {
    feed_id: number;
    title: string;
    description?: string;
    file_path: string;
}


export interface Comment {
    id: number;
    comment_body: string;
    created_at: string;
    commenter_name?: string;
    user_id?: number;
}

export interface ShareResponse {
    share_token: string;
    share_url: string;
    expires_at?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface UserShareResponse {
    id: number;
    feed_id: number;
    shared_by: {
        id: number;
        username: string;
        email: string;
    };
    shared_with: {
        id: number;
        username: string;
        email: string;
    };
    created_at: string;
    is_active: boolean;
} 