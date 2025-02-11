import { IsEmail, IsNotEmpty, IsString, IsBoolean } from "class-validator";
export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  @IsString()
  password: string;
  @IsNotEmpty()
  @IsBoolean()
  rememberMe: boolean;
}

export class checkCodeDto{
  @IsNotEmpty()
  @IsString()
  code:string;
  @IsNotEmpty()
  @IsString()
  newPwd:string
}


