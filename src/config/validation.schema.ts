import Joi from 'joi';

// Schema validate biến môi trường ngay khi app khởi động
// Nếu thiếu hoặc sai kiểu, app sẽ crash sớm thay vì lỗi ngầm lúc runtime
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(3000),

  // Database (MySQL)
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_DATABASE: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  // Redis (cho BullMQ - queue xử lý OCR)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // AI service (FastAPI)
  AI_SERVICE_URL: Joi.string().uri().required(),
  AI_SERVICE_TIMEOUT: Joi.number().default(30000),

  // S3 / storage cho ảnh receipt
  S3_BUCKET_NAME: Joi.string().optional(),
  S3_REGION: Joi.string().optional(),
  S3_ACCESS_KEY: Joi.string().optional(),
  S3_SECRET_KEY: Joi.string().optional(),
});