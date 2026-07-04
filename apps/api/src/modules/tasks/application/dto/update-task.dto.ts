import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { TaskTypeEnum } from '../../domain/value-objects/task-enums';

export class UpdateTaskDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  title?: string;

  @ApiPropertyOptional({ description: 'ISO datetime' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({ enum: TaskTypeEnum })
  @IsOptional()
  @IsEnum(TaskTypeEnum)
  type?: TaskTypeEnum;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'null unlinks' })
  @IsOptional()
  @IsUUID()
  contactId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', description: 'null unlinks' })
  @IsOptional()
  @IsUUID()
  companyId?: string | null;
}
