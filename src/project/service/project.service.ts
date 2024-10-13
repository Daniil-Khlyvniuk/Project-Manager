import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/prisma';
import { Prisma, Project, ProjectStatus } from '@prisma/client';
import {
  ProjectListItem,
  ProjectListResponse,
} from 'src/project/dto/project-list-response.dto';
import { QueryParams, QueryParamsDto } from 'src/project/dto/query-params.dto';
import { CreateProjectDto } from 'src/project/dto/create-project.dto';
import { EditProjectDto } from 'src/project/dto/edit-project.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProjectListByUserId(
    userId: number,
    query: QueryParamsDto,
  ): Promise<ProjectListResponse> {
    const isValidQueryParams =
      query.hasOwnProperty(QueryParams.offset) &&
      query.hasOwnProperty(QueryParams.limit);

    if (!isValidQueryParams) {
      throw new BadRequestException('Offset and limit are required params');
    }

    const offset = Number(query.offset);
    const limit = Number(query.limit);
    const search = query?.search;

    const searchArgs = {
      where: {
        userId,
        status: { not: ProjectStatus.deleted },
        ...(!!search && {
          OR: [{ name: { contains: search } }, { url: { contains: search } }],
        }),
      },
    };

    const [data, total] = await Promise.all([
      this.findMany({
        where: searchArgs.where,
        skip: offset * limit,
        take: limit,
      }),
      this.count({
        where: searchArgs.where,
      }),
    ]);

    return {
      data: data.map(this.prepareProjectToResponse),
      size: data.length,
      total,
      offset,
      limit,
    };
  }

  async createNewProject(
    userId: number,
    postDto: CreateProjectDto,
  ): Promise<Project> {
    if (!(postDto.name && postDto.url)) {
      throw new BadRequestException('"name" and "url" are required');
    }

    const isExists = await this.prismaService.project.findFirst({
      where: {
        userId,
        status: { not: ProjectStatus.deleted },
        OR: [{ name: postDto.name }, { url: postDto.url }],
      },
    });

    if (isExists) {
      throw new ConflictException(
        `Current user already has a project with name "${postDto.name}' or url "${postDto.url}"`,
      );
    } else {
      return this.create({
        data: {
          ...postDto,
          status: this.getExpiredOrActiveStatus(postDto.expiredAt),
          userId: userId,
        },
      });
    }
  }

  async editProject(
    userId: number,
    projectId: number,
    projectDto: EditProjectDto,
  ): Promise<Project> {
    await this.checkExistingProject(userId, projectId);

    if (projectDto.name || projectDto.url) {
      const isExists = await this.prismaService.project.findFirst({
        where: {
          userId,
          id: { not: projectId },
          status: { not: ProjectStatus.deleted },
          OR: [
            ...(projectDto.name && [{ name: projectDto.name }]),
            ...(projectDto.url && [{ url: projectDto.url }]),
          ],
        },
      });

      if (isExists) {
        throw new ConflictException(
          `Current user already has project with the same${projectDto.name && ` name "${projectDto.name}"`}${projectDto.url && ` url "${projectDto.url}"`}`,
        );
      }
    }

    if (projectDto.expiredAt && this.isExpiredDate(projectDto.expiredAt)) {
      projectDto.status = ProjectStatus.expired;
    }

    return await this.update({
      where: { id: projectId },
      data: projectDto,
    });
  }

  async checkExistingProject(userId: number, id: number): Promise<boolean> {
    try {
      await this.prismaService.project.findUniqueOrThrow({
        where: { userId, id, status: { not: ProjectStatus.deleted } },
      });

      return true;
    } catch (err) {
      throw new NotFoundException(`Project with id "${id}" is not found`);
    }
  }

  prepareProjectToResponse(data: Project): ProjectListItem {
    const { id, name, url, status, expiredAt, createdAt, updatedAt } = data;
    return { id, name, url, status, expiredAt, createdAt, updatedAt };
  }

  async findMany(args: Prisma.ProjectFindManyArgs): Promise<Project[]> {
    return this.prismaService.project.findMany(args);
  }

  async create(args: Prisma.ProjectCreateArgs): Promise<Project> {
    return this.prismaService.project.create(args);
  }

  async update(args: Prisma.ProjectUpdateArgs): Promise<Project> {
    return this.prismaService.project.update(args);
  }

  async count(
    args: Prisma.ProjectCountArgs,
    ignoreDeleted = true,
  ): Promise<number> {
    return this.prismaService.project.count({
      ...args,
      ...(ignoreDeleted && {
        where: {
          ...args.where,
          status: { not: ProjectStatus.deleted },
        },
      }),
    });
  }

  private getExpiredOrActiveStatus(
    expiredDate?: Date,
    status?: ProjectStatus,
  ): ProjectStatus {
    if (!expiredDate) return status || ProjectStatus.active;

    return this.isExpiredDate(expiredDate)
      ? ProjectStatus.expired
      : status || ProjectStatus.active;
  }

  private isExpiredDate(expiredDate: Date): boolean {
    const now = new Date();
    return expiredDate <= now;
  }
}
