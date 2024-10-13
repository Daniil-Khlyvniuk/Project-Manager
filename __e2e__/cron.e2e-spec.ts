import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from '../src/cron/service/cron.service';
import { ProjectService } from '../src/project/service/project.service';
import { Project, ProjectStatus } from '@prisma/client';

describe('CronService (e2e)', () => {
  let cronService: CronService;
  let projectService: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        {
          provide: ProjectService,
          useValue: {
            findMany: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    cronService = module.get<CronService>(CronService);
    projectService = module.get<ProjectService>(ProjectService);
  });

  it('should mark expired projects as expired', async () => {
    const mockProjects = [
      {
        id: 1,
        status: ProjectStatus.active,
        expiredAt: new Date(Date.now() - 10000),
      },
      {
        id: 2,
        status: ProjectStatus.active,
        expiredAt: new Date(Date.now() + 10000),
      },
    ] as Project[];

    jest
      .spyOn(projectService, 'findMany')
      .mockResolvedValueOnce(
        mockProjects.filter((project) => project.expiredAt < new Date()),
      );

    jest.spyOn(projectService, 'update').mockResolvedValueOnce({
      id: 1,
      status: ProjectStatus.expired,
    } as Project);

    await cronService.markExpiredProjects();

    expect(projectService.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: ProjectStatus.expired },
    });
  });
});
