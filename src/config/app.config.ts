import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
}));

// Config gọi sang FastAPI (OCR + phân loại category)
export const aiServiceConfig = registerAs('aiService', () => ({
  url: process.env.AI_SERVICE_URL,
  timeout: parseInt(process.env.AI_SERVICE_TIMEOUT || '30000', 10),
}));

export const s3Config = registerAs('s3', () => ({
  bucket: process.env.S3_BUCKET_NAME,
  region: process.env.S3_REGION,
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY,
}));

// Config upload ảnh hóa đơn lên Cloudinary (thay thế lưu file local)
export const cloudinaryConfig = registerAs('cloudinary', () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey:    process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
}));