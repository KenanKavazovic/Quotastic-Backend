import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateQuoteDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(280)
  text?: string;

  @IsOptional()
  karma?: number;
}