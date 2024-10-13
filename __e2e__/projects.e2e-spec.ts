import { Test, TestingModule } from '@nestjs/testing';
import { ProjectModule } from '../src/project/module';
import { ProjectService } from '../src/project/service/project.service';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Project } from '@prisma/client';
import { AuthService } from '../src/auth/service/auth.service';
import { AuthModule } from '../src/auth/module';
import { responseMock } from './values/project-list-mock-response';

describe('ProjectController (e2e)', () => {
  let app: INestApplication;
  let projectService: ProjectService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authService: AuthService;
  let jwtService: JwtService;
  let userId: number;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProjectModule, AuthModule], // Import the module containing ProjectController
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    projectService = moduleFixture.get<ProjectService>(ProjectService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    userId = 1;

    token = jwtService.sign(
      { sub: userId },
      {
        secret: process.env.JWT_SECRETKEY,
        expiresIn: '1h',
      },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('/projects (GET)', async () => {
    const queryParams = { limit: 10, offset: 0 };

    jest
      .spyOn(projectService, 'getProjectListByUserId')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      .mockResolvedValueOnce(responseMock);

    const response = await request(app.getHttpServer())
      .get('/projects')
      .set('Authorization', `Bearer ${token}`)
      .query(queryParams)
      .expect(200);

    expect(response.body).toEqual(responseMock);
  });

  it('/projects (POST)', async () => {
    const projectDto = {
      name: 'Margarita',
      url: 'www.Margarita.com',
    };

    jest.spyOn(projectService, 'createNewProject').mockResolvedValueOnce({
      id: 1,
      ...projectDto,
    } as Project);

    const response = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(projectDto)
      .expect(201);

    expect(response.body).toEqual({
      id: 1,
      ...projectDto,
    });
  });

  it('/projects/:id (PUT)', async () => {
    const projectId = 1;
    const projectDto = {
      name: 'Margarita',
      url: 'www.Margarita.com',
    };

    jest.spyOn(projectService, 'editProject').mockResolvedValueOnce({
      id: projectId,
      ...projectDto,
    } as Project);

    const response = await request(app.getHttpServer())
      .put(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(projectDto)
      .expect(200);

    expect(response.body).toEqual({
      id: projectId,
      ...projectDto,
    });
  });

  it('/projects/:id (DELETE)', async () => {
    const projectId = 1;

    jest
      .spyOn(projectService, 'checkExistingProject')
      .mockResolvedValueOnce(undefined);
    jest
      .spyOn(projectService, 'update')
      .mockResolvedValueOnce({ id: projectId } as Project);

    const response = await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Number(response.text)).toEqual(projectId);
  });
});
