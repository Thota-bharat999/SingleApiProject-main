const logger = require('./logger');

module.exports = {
    info: (msg) => logger.info(`[ADMIN] ${msg}`),
    error: (msg) => logger.error(`[ADMIN] ${msg}`),
     debug: (msg) => logger.debug(`[ADMIN] ${msg}`),
      warn: (msg) => logger.warn(`[ADMIN] ${msg}`),
};
