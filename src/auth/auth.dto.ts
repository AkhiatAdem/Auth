import { IsEmail, IsNotEmpty, IsString, isNotEmpty } from "class-validator";
export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class checkCodeDto{
  @IsNotEmpty()
  @IsString()
  code:string;
  @IsNotEmpty()
  @IsString()
  newPwd:string
}

