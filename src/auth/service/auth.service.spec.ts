import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../../user/service/user.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userService: UserService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;

  const mockUserService = {
    findByUsername: jest.fn(),
    isPasswordValid: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockUserService.findByUsername.mockResolvedValue(null);

      await expect(authService.signIn('username', 'qwerty')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserService.findByUsername).toHaveBeenCalledWith('username');
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const user = { id: 1, username: 'username', password: 'hashedPassword' };
      mockUserService.findByUsername.mockResolvedValue(user);
      mockUserService.isPasswordValid.mockResolvedValue(false);

      await expect(
        authService.signIn('username', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUserService.isPasswordValid).toHaveBeenCalledWith(
        'wrongPassword',
        'hashedPassword',
      );
    });

    it('should return a valid token if credentials are correct', async () => {
      const user = { id: 1, username: 'username', password: 'hashedPassword' };
      const token = 'validToken';
      mockUserService.findByUsername.mockResolvedValue(user);
      mockUserService.isPasswordValid.mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await authService.signIn('username', 'qwerty');

      expect(result).toEqual({ token });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        username: user.username,
      });
    });
  });

  describe('signUp', () => {
    it('should return the user without password field on successful signup', async () => {
      const createdUser = {
        id: 1,
        username: 'username',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const expectedUser = {
        id: 1,
        username: 'username',
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      };

      mockUserService.create.mockResolvedValue(createdUser);

      const result = await authService.signUp('username', 'qwerty');

      expect(result).toEqual(expectedUser);
      expect(mockUserService.create).toHaveBeenCalledWith('username', 'qwerty');
    });
  });
});
