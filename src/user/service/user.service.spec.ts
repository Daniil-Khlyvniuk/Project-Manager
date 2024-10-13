import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { PrismaService } from '../../lib/prisma';
import { UserService } from './user.service';
jest.mock('bcryptjs');

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('should return the user if found', async () => {
      const mockUser: Partial<User> = {
        id: 1,
        username: 'test',
        password: 'hashedPwd',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const result = await userService.findByUsername('test');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'test' },
      });
    });

    it('should return undefined if no user is found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(undefined);

      const result = await userService.findByUsername('username_1');
      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const mockUser: Partial<User> = {
        id: 1,
        username: 'new_user',
        password: 'hashedPwd',
      };
      const mockHash = 'hashedPwd';

      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.create('new_user', 'qwerty');

      expect(result).toEqual(mockUser);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(
        Number(process.env.PASSWORD_SALT_ROUNDS),
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('qwerty', 'salt');
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: { username: 'new_user', password: mockHash },
      });
    });

    it('should throw ConflictException if user with the same username exists', async () => {
      const error = { code: 'P2002' };

      (prismaService.user.create as jest.Mock).mockRejectedValue(error);

      await expect(
        userService.create('existingUser', 'password123'),
      ).rejects.toThrow(
        new ConflictException(
          'User with username "existingUser" already exists',
        ),
      );
    });
  });

  describe('isPasswordValid', () => {
    it('should return true if the password is valid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await userService.isPasswordValid('qwerty', 'hashedPwd');
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('qwerty', 'hashedPwd');
    });

    it('should return false if the password is invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await userService.isPasswordValid(
        'wrongPassword',
        'hashedPwd',
      );
      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPwd');
    });
  });

  describe('hashPassword', () => {
    it('should generate a salt and hash the password', async () => {
      const mockSalt = 'randomSalt';
      const mockHash = 'hashedPwd';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await (userService as any).hashPassword('qwerty');

      expect(result).toBe(mockHash);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(
        Number(process.env.PASSWORD_SALT_ROUNDS),
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('qwerty', mockSalt);
    });
  });
});
