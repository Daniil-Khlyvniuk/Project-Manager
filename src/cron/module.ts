import { Module } from '@nestjs/common';
import { CronService } from './service/cron.service';
import { ProjectModule } from '../project/module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), ProjectModule],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
