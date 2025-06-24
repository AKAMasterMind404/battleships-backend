export interface ISession {
    _id?: string;
    user_id: string;
    username: string;
    token: string;
    is_signed_in: boolean;
    created_at: Date;
}
