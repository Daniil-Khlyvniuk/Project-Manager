import { ConflictException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../lib/prisma';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async findByUsername(username: string): Promise<User | undefined> {
    return this.prismaService.user.findUnique({ where: { username } });
  }

  async create(username: string, password: string): Promise<User> {
    const pwdHash = await this.hashPassword(password);

    try {
      return await this.prismaService.user.create({
        data: { password: pwdHash, username },
      });
    } catch (err) {
      if (err.code === 'P2002') {
        throw new ConflictException(
          `User with username "${username}" already exists`,
        );
      }
      throw err;
    }
  }

  async isPasswordValid(pwdToCheck: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pwdToCheck, hash);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(Number(process.env.PASSWORD_SALT_ROUNDS));
    return await bcrypt.hash(password, salt);
  }
}
