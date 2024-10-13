import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { SignInDto } from '../dto/sign-in.dto';
import { SignUpDto } from '../dto/sign-up.dto';
import { AuthGuard } from '../guard/auth.guard';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto.username, dto.password);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('sign-up')
  async signUp(@Body() dto: SignUpDto): Promise<Omit<User, 'password'>> {
    return await this.authService.signUp(dto.username, dto.password);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getHello(@Request() req): string {
    return req.user;
  }
}
