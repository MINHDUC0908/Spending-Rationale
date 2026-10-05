import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    constructor(private readonly configService: ConfigService) {
        // Cấu hình Cloudinary từ biến môi trường khi service được khởi tạo
        cloudinary.config({
            cloud_name: this.configService.get<string>('cloudinary.cloudName'),
            api_key:    this.configService.get<string>('cloudinary.apiKey'),
            api_secret: this.configService.get<string>('cloudinary.apiSecret'),
        });
    }

    /**
     * Upload ảnh từ buffer (memory) lên Cloudinary
     * @param buffer   - Buffer file ảnh (từ Multer memoryStorage)
     * @param folder   - Thư mục lưu trên Cloudinary (VD: 'receipts')
     * @returns        - URL HTTPS của ảnh sau khi upload thành công
     */
    async uploadBuffer(buffer: Buffer, folder = 'receipts'): Promise<string> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        folder,
                        resource_type: 'image',
                        // Tự động tối ưu chất lượng và định dạng (webp/avif)
                        transformation: [
                            { quality: 'auto:good' },
                            { fetch_format: 'auto' },
                        ],
                    },
                    (error, result: UploadApiResponse | undefined) => {
                        if (error || !result) {
                            reject(
                                new InternalServerErrorException(
                                    `Upload ảnh lên Cloudinary thất bại: ${error?.message ?? 'Unknown error'}`,
                                ),
                            );
                        } else {
                            resolve(result.secure_url);
                        }
                    },
                )
                .end(buffer);
        });
    }

    /**
     * Xóa ảnh khỏi Cloudinary theo public_id
     * @param publicId - ID ảnh trên Cloudinary (lấy từ URL)
     */
    async deleteImage(publicId: string): Promise<void> {
        await cloudinary.uploader.destroy(publicId);
    }
}
