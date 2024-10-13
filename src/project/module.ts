import { Module } from '@nestjs/common';
import { ProjectController } from './controller/project.controller';
import { ProjectService } from './service/project.service';
import { PrismaService } from '../lib/prisma';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, PrismaService],
  exports: [ProjectService],
})
export class ProjectModule {}
