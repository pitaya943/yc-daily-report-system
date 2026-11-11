import { IsString, MinLength } from 'class-validator';
import { ValidationMessages } from '@yc/validation';

export class SignInDto {
  @IsString({ message: ValidationMessages.accountRequired })
  @MinLength(1, { message: ValidationMessages.accountRequired })
  displayName!: string;

  @IsString({ message: ValidationMessages.passwordLength })
  @MinLength(6, { message: ValidationMessages.passwordLength })
  password!: string;
}
