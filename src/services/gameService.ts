import { Service, Inject, Container } from 'typedi';
import HelperService from '../utils/helpers';
import { GameCreateDto, GameGetDto, GamePlayDto, IGame } from '../interfaces/IGame';

@Service()
export default class GameService {
    private helperService: HelperService;
    static POSITIONS = [
        'A1', 'A2', 'A3', 'A4', 'A5',
        'B1', 'B2', 'B3', 'B4', 'B5',
        'C1', 'C2', 'C3', 'C4', 'C5',
        'D1', 'D2', 'D3', 'D4', 'D5',
        'E1', 'E2', 'E3', 'E4', 'E5',
    ];
    static RANDOM_AI = "random";
    static PERFECT_AI = "perfect";
    static ONESHIP_AI = "oneship";

    constructor(
        @Inject('logger') private logger,
        @Inject('gameModel') private gameModel: Models.gameModel,
    ) {
        this.helperService = Container.get(HelperService);
    }

    public buildGameGetDto(req: any): GameGetDto {
        const dto = new GameGetDto();
        dto.id = req.params.id;
        dto.max = req.body.hasOwnProperty('max') ? +req.body.max : 10;
        dto.page = req.body.hasOwnProperty('page') ? +req.body.page : 0;
        dto.player = req.claims._id;
        return dto;
    }

    public buildGamePlayDto(req: any, isDelete: boolean): GamePlayDto {
        const dto = new GamePlayDto();
        dto.id = req.params.game_id;
        dto.shot = req.body.shot;
        dto.player = req.claims._id;

        if (!dto.id) {
            throw new Error("Game Id required to play!");
        }

        if (!isDelete && !dto.shot) {
            throw new Error("Choose a shot to play!");
        }

        return dto;
    }

    public buildGameCreateDto(req: any): GameCreateDto {
        const dto = new GameCreateDto();
        dto.player1 = req.claims._id;
        dto.ships = req.body.hasOwnProperty('ships') ? req.body.ships : undefined;
        dto.ai = req.body.hasOwnProperty('ai') ? req.body.ai : undefined;

        if (dto.ai && !([GameService.RANDOM_AI, GameService.PERFECT_AI, GameService.ONESHIP_AI].includes(dto.ai))) {
            throw new Error("Only 'random', 'oneship' and 'perfect' parameters allowed as options for A.I.!");
        }

        return dto;
    }

        public async deleteGame(id: string): Promise<{ data: any }> {
        try {
            const result = await this.gameModel.findByIdAndDelete(id);
            return { data: result };
        } catch (error) {
            throw Error('Could not create game!');
        }
    }

    public async createNewOrMatchGame(dto: GameCreateDto): Promise<{ data: any }> {
        try {
            const gameObject = { player1: dto.player1, p1Ships: dto.ships, ai: dto.ai };

            let game;
            let isNew = 0;
            const openGame = await this.gameModel.findOne({ player2: null, player1: { $ne: gameObject.player1 }, ai: { $eq: null } },);
            if (openGame) {
                game = await this.gameModel.findByIdAndUpdate(openGame._id, {
                    player2: gameObject.player1,
                    p2Ships: gameObject.p1Ships
                });
            } else {
                const newGame = await this.gameModel.create(gameObject);
                game = (newGame as any).toObject();
                isNew = 1;
            }

            if (game.ai != null) {
                const randomAIShips = this.generateRandomShipPositions(game.ai);
                const updateBody = { player2: dto.ai, p2Ships: randomAIShips, position: 1 };
                const updatedAIGame = await this.gameModel.findByIdAndUpdate(game._id, updateBody);
                game = (updatedAIGame as any).toObject();
            }

            return { data: { ...this.wrapData(game, dto.player1, isNew), g: isNew } };
        } catch (error) {
            throw Error('Could not create game!');
        }
    }

    public async playShot(dto: GamePlayDto): Promise<{ data: any }> {
        try {
            const game = await this.gameModel.findById(dto.id);
            const { message, sunk_ship, won } = this.getGameResult(game, dto, dto.shot);
            const { updateBody } = this.getUpdateBody(game, dto.player, dto.shot, won);

            const updatedGame = await this.gameModel.findByIdAndUpdate(
                dto.id,
                updateBody,
                { new: true }
            );

            return { data: { message, sunk_ship, won } };
        } catch (error) {
            throw new Error(error);
        }
    }

    public async getGameData(dto: GameGetDto): Promise<{ data: any }> {
        try {
            let data;
            if (dto.id) {
                const gameData = await this.gameModel.findById(dto.id);
                data = this.wrapData(gameData, dto.player);
            } else {
                const gameList = await this.gameModel.find().skip(dto.max * dto.page).limit(dto.max);
                data = gameList.map((e) => this.wrapData(e, dto.player));
            }

            return { data };
        } catch (error) {
            throw Error('Trouble fetching games!');
        }
    }

    private wrapData(gameData: IGame, playerId, isNewGame: number = 1) {
        const enemyShots = gameData.player1 == playerId ? gameData.p2Shots : gameData.p1Shots;
        const playerShots = gameData.player1 == playerId ? gameData.p1Shots : gameData.p2Shots;

        const ships = gameData.player1 == playerId || isNewGame == 0 ? gameData.p1Ships : gameData.p2Ships;
        const enemyShips = gameData.player1 == playerId ? gameData.p2Ships : gameData.p1Ships;

        const wrecks = enemyShots.filter((shot) => ships.includes(shot));
        const sunk = playerShots.filter((shot) => enemyShips.includes(shot));
        const shots = playerShots;

        return {
            _id: gameData._id,
            status: gameData.status,
            position: gameData.position,
            player1: gameData.player1,
            player2: gameData.player2,
            ships: ships.filter((s) => !wrecks.includes(s)),
            playerTurn: gameData.status == 0 && gameData.position == playerId,
            ai: gameData.ai,
            wrecks,
            sunk,
            shots
        };
    }

    private getUpdateBody(
        game: IGame,
        player: string,
        shot: string,
        won: boolean
    ): { updateBody: any } {
        const push: any = {};
        const set: any = {};

        // Push the player's shot
        if (game.player1 === player) {
            push['p1Shots'] = shot;
        } else {
            push['p2Shots'] = shot;
        }

        // Switch turn (position alternates)
        set['position'] = game.position === 1 ? 2 : 1;

        // If player won, set status
        if (won) {
            set['status'] = game.player1 === player ? 1 : 2;
        } else if (game.ai) {
            // AI makes a move
            const aiMove = this.generateAIMove(game.p1Ships, game.p2Shots, game.ai);

            // Check how many player1 ships are sunk (including this AI move)
            const sunkCount = game.p1Ships.filter(
                (ship) => game.p2Shots.includes(ship) || aiMove === ship
            ).length;

            const aiWon = sunkCount === game.p1Ships.length;
            if (aiWon) {
                set['status'] = 2; // AI wins
            }

            set['position'] = 1; // back to player1
            push['p2Shots'] = aiMove; // AI shot is also pushed
        }

        const updateBody: any = {
            $set: set,
            $push: push,
        };

        return { updateBody };
    }

    private getGameResult(game: IGame, dto: GamePlayDto, shot: string): { message: any; sunk_ship: any; won: any; } {
        if (!game) {
            throw new Error('Game does not exist!');
        }

        if ((game.player1 != dto.player && game.player2 != dto.player) || (game.ai != null && dto.player != game.player1)) {
            throw new Error('You are not a part of this game!');
        }

        if(!game.player2) {
            throw new Error("This game is still in match making!");
        }

        if (game.status > 0) {
            throw new Error("This game is already over!");
        }

        const playerPosition = game.player1 == dto.player ? 1 : 2;
        if (playerPosition != game.position) {
            throw new Error("Not your turn");
        }

        const playerShots = playerPosition == 1 ? game.p1Shots : game.p2Shots;
        if (playerShots.includes(shot)) {
            throw new Error("You have already placed a shot here!");
        }

        const enemyShips = playerPosition == 1 ? game.p2Ships : game.p1Ships;
        const sunk_ship = enemyShips.includes(shot);

        let sunkCount = 0;
        for (let i = 0; i < enemyShips.length; i++) {
            const currShip = enemyShips[i];
            if (playerShots.includes(currShip) || shot == currShip) {
                sunkCount++;
            }
        }

        const won = sunkCount == enemyShips.length;
        const message = sunk_ship ? "Shot Played Successfully!" : "Shot Missed!";

        return { message, sunk_ship, won };
    }

    private generateAIMove(p1Ships: string[], p2Shots: string[], ai: string): string {
        const legalMoves = GameService.POSITIONS.filter((position) => !p2Shots.includes(position));
        const playerShots = legalMoves.filter((move) => p1Ships.includes(move));

        const ai_shot = HelperService.getRandomItem([GameService.RANDOM_AI, GameService.ONESHIP_AI].includes(ai) ? legalMoves : playerShots);
        return ai_shot;
    }

    private generateRandomShipPositions(ai: string): string[] {
        const shuffled = HelperService.shuffleRandomly(GameService.POSITIONS);
        const shipList = shuffled.slice(0, [GameService.RANDOM_AI, GameService.PERFECT_AI].includes(ai) ? 5 : 1);

        return shipList;
    }

}