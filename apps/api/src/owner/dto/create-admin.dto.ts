import { IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  displayName!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
