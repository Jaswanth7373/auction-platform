const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
const { createLogger, format, transports } = winston;
const { combine, timestamp, errors, json, colorize, simple } = format;

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json()),
  defaultMeta: { service: 'auction-platform' },
  transports: [
    new transports.Console({
      format: combine(colorize(), simple()),
    }),
    // File transports only if logs dir exists
    ...(process.env.NODE_ENV === 'production' ? [
      new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
      new transports.File({ filename: path.join(logDir, 'combined.log') }),
    ] : []),
  ],
});

module.exports = logger;
