import { Module } from '@nestjs/common';
import { config } from 'dotenv';
import { ProjectModule } from './project/module';
import { UserModule } from './user/module';
import { AuthModule } from './auth/module';
import { CronModule } from './cron/module';

config();

@Module({
  imports: [AuthModule, UserModule, ProjectModule, CronModule],
})
export class AppModule {}
