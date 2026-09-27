import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';

// Payload tối thiểu trong JWT — không nhét dữ liệu nhạy cảm hay dư thừa
interface JwtPayload {
  sub: string;
  email: string;
}

// Thông tin user trả về sau register/login — không bao giờ trả password/hash
export interface AuthUserResponse {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  provider: 'google' | 'local';
  createdAt: Date;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUserResponse;
}

// Dummy hash dùng để chống Timing Attack khi user không tồn tại
// bcrypt.compare tốn thời gian — nếu bỏ qua bước này, attacker có thể
// phân biệt "sai email" vs "sai password" qua thời gian phản hồi khác nhau
const DUMMY_HASH =
  '$2b$10$abcdefghijklmnopqrstuvuDummyHashForTimingAttackMitigation';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto): Promise<AuthUserResponse> {
    // 1. Kiểm tra email đã tồn tại chưa
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // 2. Hash password — salt rounds 10 (cân bằng bảo mật & CPU)
    const hashedPassword = await hash(dto.password, BCRYPT_SALT_ROUNDS);

    // 3. Tạo user mới trong database
    const user = await this.usersService.createLocalUser({
      email: dto.email,
      fullName: dto.fullName,
      hashedPassword,
    });

    // 4. Trả về thông tin user đã lọc bỏ password — KHÔNG BAO GIỜ trả hash
    return this.toAuthUserResponse(user);
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    // 1. Tìm user theo email kèm password (select: false nên cần QueryBuilder)
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    // 2. Chống Timing Attack: luôn gọi compare dù user không tồn tại
    //    Điều này đảm bảo thời gian phản hồi đồng nhất,
    //    ngăn attacker đoán email hợp lệ thông qua thời gian phản hồi
    const passwordToCompare = user?.password ?? DUMMY_HASH;
    const isPasswordValid = await compare(dto.password, passwordToCompare);

    // 3. Thông báo lỗi chung — không tiết lộ email có tồn tại hay không
    //    (Username Enumeration Prevention)
    if (!user || !user.password || !isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 4. Ký JWT Access Token với payload tối thiểu
    //    Secret & expiration được đọc từ JwtModule config (lấy từ .env)
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.toAuthUserResponse(user),
    };
  }

  /** Map User entity → response object, loại bỏ password và các field nhạy cảm */
  private toAuthUserResponse(user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    provider: 'google' | 'local';
    createdAt: Date;
  }): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      createdAt: user.createdAt,
    };
  }
}
