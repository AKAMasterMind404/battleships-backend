import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import middlewares from '../middlewares';
import GameService from '../../services/gameService';

const route = Router();

export default (app: Router) => {
  app.use('/games', route);
  const gameService = Container.get(GameService);

  route.post('/', middlewares.attachCurrentUser, async (req: Request, res: Response) => {
    try {
      const dto = gameService.buildGameCreateDto(req);
      const { data } = await gameService.createNewOrMatchGame(dto);

      return res.json({ data });
    }
    catch (e) {
      return res.status(500).json({ 'error': `${e.message.toString()}` });
    }
  });

  route.put('/:game_id', middlewares.attachCurrentUser, async (req: Request, res: Response) => {
    try {
      const dto = gameService.buildGamePlayDto(req);
      const { data } = await gameService.playShot(dto);

      return res.json({ data });
    }
    catch (e) {
      return res.status(500).json({ 'error': `${e.message.toString()}` });
    }
  });

  route.get('/:id?', middlewares.attachCurrentUser, async (req: Request, res: Response) => {
    try {
      const dto = gameService.buildGameGetDto(req);
      const { data } = await gameService.getGameData(dto);

      return res.json({ data });
    }
    catch (e) {
      return res.status(500).json({ 'error': `${e.message.toString()}` });
    }
  });

};