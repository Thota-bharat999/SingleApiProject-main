const logger = require('./logger');

module.exports = {
    info: (msg) => logger.info(`[USER] ${msg}`),
    error: (msg) => logger.error(`[USER] ${msg}`),
     warn: (msg) => logger.warn(`[USER] ${msg}`),
    debug: (msg) => logger.debug(`[USER] ${msg}`),
};
