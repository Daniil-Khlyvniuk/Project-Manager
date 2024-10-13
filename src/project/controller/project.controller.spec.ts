import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from '../service/project.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { EditProjectDto } from '../dto/edit-project.dto';
import { ProjectListResponse } from '../dto/project-list-response.dto';
import { Project, ProjectStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { QueryParamsDto } from '../dto/query-params.dto';
import { JwtService } from '@nestjs/jwt';

describe('ProjectController', () => {
  let projectController: ProjectController;
  let projectService: ProjectService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: {
            getProjectListByUserId: jest.fn(),
            createNewProject: jest.fn(),
            editProject: jest.fn(),
            checkExistingProject: jest.fn(),
            prepareProjectToResponse: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    projectController = module.get<ProjectController>(ProjectController);
    projectService = module.get<ProjectService>(ProjectService);
  });

  describe('getProjectList', () => {
    it('should return project list', async () => {
      const userId = 1;
      const query: QueryParamsDto = { offset: '0', limit: '10' };
      const expectedResponse: ProjectListResponse = {
        data: [],
        size: 0,
        total: 0,
        offset: 0,
        limit: 10,
      };

      jest
        .spyOn(projectService, 'getProjectListByUserId')
        .mockResolvedValue(expectedResponse);

      const result = await projectController.getProjectList(
        { user: { sub: userId } },
        query,
      );

      expect(result).toEqual(expectedResponse);
      expect(projectService.getProjectListByUserId).toHaveBeenCalledWith(
        userId,
        query,
      );
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const userId = 1;
      const projectDto: CreateProjectDto = {
        name: 'New Project',
        url: 'https://newproject.com',
        expiredAt: null,
      };
      const createdProject: Project = {
        id: 1,
        userId,
        ...projectDto,
        status: ProjectStatus.active,
        expiredAt: null,
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      jest
        .spyOn(projectService, 'createNewProject')
        .mockResolvedValue(createdProject);
      jest
        .spyOn(projectService, 'prepareProjectToResponse')
        .mockReturnValue(createdProject);

      const result = await projectController.createProject(projectDto, {
        user: { sub: userId },
      });

      expect(result).toEqual(createdProject);
      expect(projectService.createNewProject).toHaveBeenCalledWith(
        userId,
        projectDto,
      );
    });
  });

  describe('editProject', () => {
    it('should edit an existing project', async () => {
      const userId = 1;
      const projectId = 1;
      const projectDto: EditProjectDto = {
        name: 'Updated Project',
        url: 'https://updatedProject.com',
        status: ProjectStatus.archived,
      };

      const editedProject: Project = {
        userId,
        id: projectId,
        name: projectDto.name,
        url: projectDto.url,
        status: projectDto.status,
        expiredAt: null,
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      jest
        .spyOn(projectService, 'editProject')
        .mockResolvedValue(editedProject);
      jest
        .spyOn(projectService, 'prepareProjectToResponse')
        .mockReturnValue(editedProject);

      const result = await projectController.editProject(
        { user: { sub: userId } },
        projectDto,
        projectId,
      );

      expect(result).toEqual(editedProject);
      expect(projectService.editProject).toHaveBeenCalledWith(
        userId,
        projectId,
        projectDto,
      );
    });

    it('should throw NotFoundException if project does not exist', async () => {
      const userId = 1;
      const projectId = 1;
      const projectDto: EditProjectDto = { name: 'Updated Project' };

      jest.spyOn(projectService, 'editProject').mockImplementation(() => {
        throw new NotFoundException(
          `Project with id "${projectId}" is not found`,
        );
      });

      await expect(
        projectController.editProject(
          { user: { sub: userId } },
          projectDto,
          projectId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDeleteProject', () => {
    it('should soft delete a project', async () => {
      const userId = 1;
      const projectId = 1;

      jest
        .spyOn(projectService, 'checkExistingProject')
        .mockResolvedValue(true);
      jest
        .spyOn(projectService, 'update')
        .mockResolvedValue({ id: projectId } as Project);

      const result = await projectController.softDeleteProject(
        { user: { sub: userId } },
        projectId,
      );

      expect(result).toEqual(projectId);
      expect(projectService.checkExistingProject).toHaveBeenCalledWith(
        userId,
        projectId,
      );
      expect(projectService.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: { status: ProjectStatus.deleted },
      });
    });

    it('should throw NotFoundException if project does not exist', async () => {
      const userId = 1;
      const projectId = 1;

      jest
        .spyOn(projectService, 'checkExistingProject')
        .mockImplementation(() => {
          throw new NotFoundException(
            `Project with id "${projectId}" is not found`,
          );
        });

      await expect(
        projectController.softDeleteProject(
          { user: { sub: userId } },
          projectId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
