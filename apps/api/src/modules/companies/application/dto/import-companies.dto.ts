import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { CreateCompanyDto } from './create-company.dto';

export class ImportCompaniesDto {
  @IsArray()
  @ArrayMaxSize(250)
  @ValidateNested({ each: true })
  @Type(() => CreateCompanyDto)
  rows!: CreateCompanyDto[];
}

export class ImportCompaniesResultDto {
  created!: number;
  skipped!: number;
  errors!: Array<{ row: number; name: string; reason: string }>;
}
