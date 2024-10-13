import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ProjectService } from '../../project/service/project.service';
import { CronTimesEnum } from '../helpers/cron-times.enum';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class CronService {
  constructor(private readonly projectService: ProjectService) {}

  @Cron(CronTimesEnum.everyMinute)
  async markExpiredProjects(): Promise<void> {
    const updateCandidates = await this.projectService.findMany({
      where: {
        AND: [
          { status: { not: ProjectStatus.deleted } },
          { status: { not: ProjectStatus.expired } },
        ],
        expiredAt: {
          lt: new Date(),
        },
      },
    });

    void Promise.all(
      updateCandidates.map(({ id }) =>
        this.projectService.update({
          where: { id },
          data: { status: ProjectStatus.expired },
        }),
      ),
    );
  }
}
