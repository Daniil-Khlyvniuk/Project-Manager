import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from './cron.service';
import { ProjectService } from '../../project/service/project.service';
import { ProjectStatus } from '@prisma/client';

describe('CronService', () => {
  let cronService: CronService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let projectService: ProjectService;

  const mockProjectService = {
    findMany: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        { provide: ProjectService, useValue: mockProjectService },
      ],
    }).compile();

    cronService = module.get<CronService>(CronService);
    projectService = module.get<ProjectService>(ProjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should mark expired projects', async () => {
    const expiredProjects = [
      {
        id: 1,
        status: ProjectStatus.active,
        expiredAt: new Date(Date.now() - 10000),
      },
      {
        id: 2,
        status: ProjectStatus.active,
        expiredAt: new Date(Date.now() - 20000),
      },
    ];

    mockProjectService.findMany.mockResolvedValue(expiredProjects);
    mockProjectService.update.mockResolvedValueOnce(expiredProjects[0]);
    mockProjectService.update.mockResolvedValueOnce(expiredProjects[1]);

    await cronService.markExpiredProjects();

    expect(mockProjectService.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { status: { not: ProjectStatus.deleted } },
          { status: { not: ProjectStatus.expired } },
        ],
        expiredAt: { lt: expect.any(Date) },
      },
    });

    expect(mockProjectService.update).toHaveBeenCalledTimes(
      expiredProjects.length,
    );
    expect(mockProjectService.update).toHaveBeenCalledWith({
      where: { id: expiredProjects[0].id },
      data: { status: ProjectStatus.expired },
    });
    expect(mockProjectService.update).toHaveBeenCalledWith({
      where: { id: expiredProjects[1].id },
      data: { status: ProjectStatus.expired },
    });
  });

  it('should not call update if no expired projects are found', async () => {
    mockProjectService.findMany.mockResolvedValue([]);

    await cronService.markExpiredProjects();

    expect(mockProjectService.findMany).toHaveBeenCalled();
    expect(mockProjectService.update).not.toHaveBeenCalled();
  });
});
