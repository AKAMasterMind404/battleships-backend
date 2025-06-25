import { Router } from 'express';
import test from './routes/test';
import auth from './routes/auth';
import games from './routes/games';

export default () => {
	const app = Router();
	test(app);
	auth(app);
	games(app);

	return app
}