import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';

export interface CreateLocalUserData {
  email: string;
  fullName: string;
  hashedPassword: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  /**
   * Tìm user theo email (không kèm password).
   * Dùng cho việc kiểm tra email đã tồn tại khi register.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Tìm user theo ID — dùng trong JwtStrategy để validate token.
   * Không kèm password (select: false giữ nguyên).
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Tìm user theo email, kèm trường password (select: false).
   * Dùng riêng cho quá trình xác thực đăng nhập.
   * Sử dụng QueryBuilder để chủ động addSelect password — TypeORM
   * không thêm cột này vào SELECT * khi đánh dấu select: false.
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password') // Parameterized query — tuyệt đối không nối chuỗi
      .getOne();
  }

  /**
   * Tạo user mới với provider='local'.
   * Nhận vào password đã được hash — service này không hash trực tiếp.
   * Ném ConflictException nếu email đã tồn tại (race condition fallback).
   */
  async createLocalUser(data: CreateLocalUserData): Promise<User> {
    const user = this.userRepository.create({
      email: data.email,
      fullName: data.fullName,
      password: data.hashedPassword,
      provider: 'local',
      avatarUrl: null,
      googleId: null,
    });

    try {
      return await this.userRepository.save(user);
    } catch (err: unknown) {
      // MySQL error code 1062: Duplicate entry (email unique constraint)
      // Xử lý race condition: 2 request register cùng email gần như đồng thời
      const mysqlErr = err as { code?: string };
      if (mysqlErr.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw err;
    }
  }
}
