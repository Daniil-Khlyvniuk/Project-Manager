import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../service/auth.service';
import { SignInDto } from '../dto/sign-in.dto';
import { SignUpDto } from '../dto/sign-up.dto';
import { AuthGuard } from '../guard/auth.guard';
import { User } from '@prisma/client';

describe('AuthController', () => {
  let authController: AuthController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authService: AuthService;

  const mockAuthService = {
    signIn: jest.fn(),
    signUp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) }) // Mock AuthGuard to always allow access
      .compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should call AuthService.signIn with the correct parameters', async () => {
      const dto: SignInDto = { username: 'username', password: 'username' };
      const result = { token: 'token' };

      mockAuthService.signIn.mockResolvedValue(result);

      expect(await authController.signIn(dto)).toBe(result);
      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        dto.username,
        dto.password,
      );
    });
  });

  describe('signUp', () => {
    it('should call AuthService.signUp with the correct parameters and return user without password', async () => {
      const dto: SignUpDto = { username: 'username', password: 'qwerty' };
      const createdUser: Omit<User, 'password'> = {
        id: 1,
        username: 'username',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.signUp.mockResolvedValue(createdUser);

      const result = await authController.signUp(dto);

      expect(result).toEqual(createdUser);
      expect(mockAuthService.signUp).toHaveBeenCalledWith(
        dto.username,
        dto.password,
      );
    });
  });

  describe('getMe', () => {
    it('should return the user from the request object', () => {
      const mockRequest = {
        user: { id: 1, username: 'username' },
      };

      const result = authController.getHello(mockRequest);

      expect(result).toEqual(mockRequest.user);
    });
  });
});
