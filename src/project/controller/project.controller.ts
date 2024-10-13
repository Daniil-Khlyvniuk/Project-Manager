import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProjectService } from '../service/project.service';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { ProjectListResponse } from '../dto/project-list-response.dto';
import { ProjectStatus } from '@prisma/client';
import { QueryParamsDto } from 'src/project/dto/query-params.dto';
import { CreateProjectDto } from 'src/project/dto/create-project.dto';
import { EditProjectDto } from 'src/project/dto/edit-project.dto';

@UseGuards(AuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  async getProjectList(
    @Request() req,
    @Query() query: QueryParamsDto,
  ): Promise<ProjectListResponse> {
    const userId = req.user.sub as number;

    return await this.projectService.getProjectListByUserId(userId, query);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createProject(@Body() projectDto: CreateProjectDto, @Request() req) {
    const userId = req.user.sub as number;

    const createdProject = await this.projectService.createNewProject(
      userId,
      projectDto,
    );

    return this.projectService.prepareProjectToResponse(createdProject);
  }

  @HttpCode(HttpStatus.OK)
  @Put(':id')
  async editProject(
    @Request() req,
    @Body() projectDto: EditProjectDto,
    @Param('id') projectId: number,
  ) {
    const userId = Number(req.user.sub);
    const id = Number(projectId);

    const editedProject = await this.projectService.editProject(
      userId,
      id,
      projectDto,
    );

    return this.projectService.prepareProjectToResponse(editedProject);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async softDeleteProject(
    @Request() req,
    @Param('id') projectId: number,
  ): Promise<number> {
    const userId = Number(req.user.sub);
    const id = Number(projectId);

    await this.projectService.checkExistingProject(userId, id);

    const deletedProject = await this.projectService.update({
      where: { id: Number(projectId) },
      data: {
        status: ProjectStatus.deleted,
      },
    });

    return deletedProject.id;
  }
}
