import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../../user/service/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new NotFoundException(
        `User with username "${username}" is not found`,
      );
    }

    const isPasswordValid = await this.usersService.isPasswordValid(
      password,
      user.password,
    );

    if (isPasswordValid) {
      const payload = { sub: user.id, username: user.username };
      return { token: await this.jwtService.signAsync(payload) };
    } else {
      throw new UnauthorizedException();
    }
  }

  async signUp(
    username: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...user } = await this.usersService.create(
      username,
      password,
    );

    return user;
  }
}
