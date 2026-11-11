import { IsString, MinLength } from 'class-validator';
import { ValidationMessages } from '@yc/validation';

export class CreateAdminDto {
  @IsString({ message: ValidationMessages.displayNameRequired })
  @MinLength(1, { message: ValidationMessages.displayNameRequired })
  displayName!: string;

  @IsString({ message: ValidationMessages.passwordLength })
  @MinLength(6, { message: ValidationMessages.passwordLength })
  password!: string;
}
