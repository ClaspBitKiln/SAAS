import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactNoteDto {
  @ApiProperty({ example: 'Called back — interested in pricing.' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}

export class ContactNoteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  contactId!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty({ nullable: true })
  createdById!: string | null;

  @ApiProperty()
  createdAt!: string;
}
