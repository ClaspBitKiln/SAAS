import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID, Length, MinLength } from 'class-validator';

export class SetPasswordDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @Length(8, 128)
  password!: string;
}
