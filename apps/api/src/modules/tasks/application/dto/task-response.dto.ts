import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatusEnum, TaskTypeEnum } from '../../domain/value-objects/task-enums';
import { Task } from '../../domain/entities/task.entity';

export class TaskResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty() assigneeUserId!: string;
  @ApiPropertyOptional() contactId!: string | null;
  @ApiPropertyOptional() companyId!: string | null;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: TaskTypeEnum }) type!: TaskTypeEnum;
  @ApiProperty({ enum: TaskStatusEnum }) status!: TaskStatusEnum;
  @ApiProperty() dueAt!: Date;
  @ApiPropertyOptional() completedAt!: Date | null;
  @ApiProperty() version!: number;
}

export function toTaskResponse(t: Task): TaskResponseDto {
  return {
    id: t.id,
    tenantId: t.tenantId,
    organizationId: t.organizationId,
    assigneeUserId: t.assigneeUserId,
    contactId: t.contactId,
    companyId: t.companyId,
    title: t.title,
    type: t.type,
    status: t.status,
    dueAt: t.dueAt,
    completedAt: t.completedAt,
    version: t.version,
  };
}
