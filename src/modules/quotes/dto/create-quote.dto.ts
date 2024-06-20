import { IsString, MaxLength, MinLength } from 'class-validator'

export class CreateQuoteDto {
  @IsString()
  @MinLength(3)
  @MaxLength(280)
  text: string

}
