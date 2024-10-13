import { Project } from '@prisma/client';

export type EditProjectDto = Partial<
  Pick<Project, 'name' | 'status' | 'url' | 'expiredAt'>
>;
