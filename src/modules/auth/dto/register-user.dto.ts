import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator'
import { Match } from '../../../decorators/match.decorator'

export class RegisterUserDto {
  @IsNotEmpty()
  firstName: string

  @IsNotEmpty()
  lastName: string

  @IsNotEmpty()
  @IsEmail()
  email: string

  refresh_token: string;

  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{6,}$/, {
    message:
      'Password must have at least one number, lower and upper case letter and it has to be longer than 5 characters.',
  })
  password: string

  @IsNotEmpty()
  @Match(RegisterUserDto, (s) => s.password, { message: 'Passwords do not match.' })
  confirm_password: string
}