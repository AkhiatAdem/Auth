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


export type GoogleTokensResult = {
  access_token: string;
  expires_in: Number;
  refresh_token: string;
  scope: string;
  id_token: string;
}

export type  GoogleUserResult = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}
