import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { PrismaService } from '../../lib/prisma';
import { Project, ProjectStatus } from '@prisma/client';
import { CreateProjectDto } from 'src/project/dto/create-project.dto';

describe('ProjectService', () => {
  let projectService: ProjectService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    projectService = module.get<ProjectService>(ProjectService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('createNewProject', () => {
    const userId = 1;
    const createProjectDto: CreateProjectDto = {
      name: 'Google',
      url: 'https://google.com',
      expiredAt: null,
    };

    it('should create a new project when no conflict exists', async () => {
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.project, 'create').mockResolvedValue({
        id: 1,
        ...createProjectDto,
        status: ProjectStatus.active,
        userId,
      } as Project);

      const result = await projectService.createNewProject(
        userId,
        createProjectDto,
      );

      expect(prismaService.project.create).toHaveBeenCalledWith({
        data: {
          ...createProjectDto,
          status: ProjectStatus.active,
          userId,
        },
      });
      expect(result).toEqual({
        id: 1,
        ...createProjectDto,
        status: ProjectStatus.active,
        userId,
      });
    });

    it('should throw ConflictException if a project with the same name or url exists', async () => {
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue({
        id: 1,
        ...createProjectDto,
        userId,
      } as Project);

      await expect(
        projectService.createNewProject(userId, createProjectDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if required fields are missing', async () => {
      await expect(
        projectService.createNewProject(userId, { name: '', url: '' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
