import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class RegisterDto {
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    @MaxLength(255, { message: 'Email không được vượt quá 255 ký tự' })
    @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    // Giới hạn 72 ký tự: bcrypt chỉ xử lý tối đa 72 bytes
    // Vượt quá giới hạn này có thể gây DoS attack làm nghẽn CPU
    @MaxLength(72, { message: 'Mật khẩu không được vượt quá 72 ký tự' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
        message:
            'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
    })
    password: string;

    @IsString()
    @IsNotEmpty({ message: 'Họ tên không được để trống' })
    @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
    @Transform(({ value }: { value: string }) => value?.trim())
    fullName: string;
}
