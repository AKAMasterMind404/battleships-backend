export interface IPlayer {
    id: number;
    email: string;
    password: string;
}

export class PlayerCreateDto {
    id: number;
    email: string;
    password: string;
}

export class AuthDto {
    email: string;
    password: string;
    token: string;
}