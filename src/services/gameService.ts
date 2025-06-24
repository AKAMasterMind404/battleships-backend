import { Service, Inject, Container } from 'typedi';
import HelperService from '../utils/helpers';
import { GameCreateDto, GameGetDto } from '../interfaces/IGame';

@Service()
export default class GameService {
    private helperService: HelperService;

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
        return dto;
    }

    public buildGameCreateDto(req: any): GameCreateDto {
        const dto = new GameCreateDto();
        dto.player1 = req.claims._id;
        dto.ships = req.body.hasOwnProperty('ships') ? req.body.ships : undefined;
        dto.ai = req.body.hasOwnProperty('ai') ? req.body.ai : undefined;

        if (dto.ai && !(['random', 'perfect'].includes(dto.ai))) {
            throw new Error("Only 'random' and 'perfect' parameters allowed as options for A.I.!");
        }

        return dto;
    }

    public async createGame(dto: GameCreateDto): Promise<{ data: any }> {
        try {
            const gameObject = {
                player1: dto.player1,
                p1Ships: dto.ships
            };

            const game = await this.gameModel.create(gameObject);
            return { data: game };
        } catch (error) {
            throw Error('Could not create game!');
        }
    }

    public async getGameData(dto: GameGetDto): Promise<{ data: any }> {
        try {
            let data;
            if (dto.id) {
                data = await this.gameModel.findById(dto.id);
            } else {
                data = await this.gameModel.find().skip(dto.max * dto.page).limit(dto.max);
            }

            return { data };
        } catch (error) {
            throw Error('Trouble fetching games!');
        }
    }
}