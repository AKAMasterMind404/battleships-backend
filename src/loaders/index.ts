import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjector';
import mongooseLoader from './mongoose';
import Logger from './logger';
//We have to import at least all the events once so they can be triggered

export default async ({ expressApp }) => {
  const mongoConnection = await mongooseLoader();
  Logger.info('✌️ DB loaded and connected!');

  /**
   * WTF is going on here?
   *
   * We are injecting the mongoose models into the DI container.
   * I know this is controversial but will provide a lot of flexibility at the time
   * of writing unit tests, just go and check how beautiful they are!
   */

  const playerModel = {
    name: 'playerModel',
    model: require('../models/player').default,
  };

  const sessionModel = {
    name: 'sessionModel',
    model: require('../models/session').default,
  };

  const gameModel = {
    name: 'gameModel',
    model: require('../models/game').default,
  };

  const { logger } = await dependencyInjectorLoader({
    mongoConnection,
    models: [
      playerModel,
      sessionModel,
      gameModel
    ],
  });

  Logger.info('✌️ Dependency Injector loaded');

  await expressLoader({ app: expressApp });
  Logger.info('✌️ Express loaded');
};
