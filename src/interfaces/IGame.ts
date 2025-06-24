export interface IGame {
    winner: string;
    player1: string;
    player2: string;
    turn: string;
    p1Ships: string;
    p2Ships: string;
    p1Shots: string;
    p2Shots: string;
}

export class GameCreateDto {
    ships: string[];
    player1: string;
    ai: string;
}

export class GameGetDto {
    id: string;
    max: number;
    page: number;
}