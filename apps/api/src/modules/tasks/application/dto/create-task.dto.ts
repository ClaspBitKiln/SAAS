import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { TaskTypeEnum } from '../../domain/value-objects/task-enums';

export class CreateTaskDto {
  @ApiProperty({ minLength: 2, maxLength: 255 })
  @IsString()
  @Length(2, 255)
  title!: string;

  @ApiProperty({ description: 'ISO datetime', example: '2026-07-05T10:00:00.000Z' })
  @IsDateString()
  dueAt!: string;

  @ApiPropertyOptional({ enum: TaskTypeEnum, default: TaskTypeEnum.TODO })
  @IsOptional()
  @IsEnum(TaskTypeEnum)
  type?: TaskTypeEnum;

  @ApiPropertyOptional({ format: 'uuid', description: 'Defaults to creator' })
  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}
