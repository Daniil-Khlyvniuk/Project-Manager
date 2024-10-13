import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
  } as unknown as ExecutionContext;

  const mockRequest = {
    headers: {
      authorization: 'Bearer validToken',
    },
    user: null,
  } as Partial<Request & { user: Partial<User> }>;

  beforeEach(() => {
    jwtService = mockJwtService as any;
    authGuard = new AuthGuard(jwtService);
    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
      mockRequest,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return true if the token is valid', async () => {
    const mockPayload = { userId: 1 };

    mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

    const result = await authGuard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('validToken', {
      secret: process.env.JWT_SECRETKEY,
    });
    expect(mockRequest.user).toEqual(mockPayload);
  });

  it('should throw UnauthorizedException if the token is invalid', async () => {
    mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    await expect(authGuard.canActivate(mockContext)).rejects.toThrow(
      new UnauthorizedException('Invalid token'),
    );
  });

  it('should throw UnauthorizedException if the token is expired', async () => {
    const expiredError = new Error('Token expired');
    expiredError.name = 'TokenExpiredError';
    mockJwtService.verifyAsync.mockRejectedValue(expiredError);

    await expect(authGuard.canActivate(mockContext)).rejects.toThrow(
      new UnauthorizedException('Token expired'),
    );
  });

  it('should return undefined when the Authorization type is not Bearer', () => {
    const mockRequest = {
      headers: {
        authorization: 'Basic abcdef123456',
      },
    } as Partial<Request>;

    const token = authGuard['extractTokenFromHeader'](mockRequest as Request);
    expect(token).toBeUndefined();
  });

  it('should return empty string if no token is provided in the Authorization header', () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer ',
      },
    } as Partial<Request>;

    const token = authGuard['extractTokenFromHeader'](mockRequest as Request);
    expect(token).toEqual('');
  });

  it('should return undefined if there is no Authorization header', () => {
    const mockRequest = {
      headers: {},
    } as Partial<Request>;

    const token = authGuard['extractTokenFromHeader'](mockRequest as Request);
    expect(token).toBeUndefined();
  });
});
