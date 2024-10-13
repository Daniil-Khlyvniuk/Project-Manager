import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthService } from '../src/auth/service/auth.service';
import { AuthModule } from '../src/auth/module';
import { SignInDto } from 'src/auth/dto/sign-in.dto';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { JwtService } from '@nestjs/jwt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authService: AuthService;
  let jwtService: JwtService;

  const mockAuthService = {
    signIn: jest.fn(),
    signUp: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/sign-up (POST)', async () => {
    const signUpDto: SignUpDto = { username: 'username', password: 'qwerty' };
    mockAuthService.signUp.mockResolvedValueOnce({
      username: signUpDto.username,
    });

    const response = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send(signUpDto)
      .expect(201);

    expect(response.body).toEqual({ username: signUpDto.username });
    expect(mockAuthService.signUp).toHaveBeenCalledWith(
      signUpDto.username,
      signUpDto.password,
    );
  });

  it('/auth/sign-in (POST)', async () => {
    const signInDto: SignInDto = { username: 'username', password: 'qwerty' };
    mockAuthService.signIn.mockResolvedValueOnce({ token: 'token' });

    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send(signInDto)
      .expect(200);

    expect(response.body).toEqual({ token: 'token' });
    expect(mockAuthService.signIn).toHaveBeenCalledWith(
      signInDto.username,
      signInDto.password,
    );
  });

  it('/auth/me (GET)', async () => {
    const user = { username: 'username' };
    const token = jwtService.sign({ username: user.username });

    mockAuthService.signIn.mockResolvedValueOnce({ user, token });

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(JSON.parse(response.text).username).toEqual(user.username);
  });
});
