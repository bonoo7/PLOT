const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// إنشاء مجلد logs إذا لم يكن موجوداً
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.json()
    ),
    defaultMeta: { service: 'plot-server' },
    transports: [
        new transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 3
        }),
        new transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        })
    ]
});

// في بيئة التطوير: اعرض السجلات في الطرفية بشكل ملون وقابل للقراءة
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, ...meta }) => {
                const extras = Object.keys(meta).length && meta.service !== 'plot-server'
                    ? ' ' + JSON.stringify(meta)
                    : '';
                return `${timestamp} [${level}]: ${message}${extras}`;
            })
        )
    }));
}

module.exports = logger;
