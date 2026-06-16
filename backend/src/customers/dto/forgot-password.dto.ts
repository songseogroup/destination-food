import { IsEmail, IsString, MinLength } from 'class-validator';

export class CustomerForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class CustomerResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}
