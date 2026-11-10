import { IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsString()
  displayName!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
