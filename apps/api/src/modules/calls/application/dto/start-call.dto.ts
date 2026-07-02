import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID, Length } from 'class-validator';
import { CallDirectionEnum } from '../../domain/value-objects/call-direction.vo';

export class StartCallDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  contactId!: string;

  @ApiProperty({ enum: CallDirectionEnum })
  @IsEnum(CallDirectionEnum)
  direction!: CallDirectionEnum;

  @ApiProperty()
  @IsString()
  @Length(3, 50)
  phone!: string;
}
