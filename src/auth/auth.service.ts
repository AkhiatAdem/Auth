import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from "../schema";
import { AuthDto } from './auth.dto';
import { GoogleTokensResult, GoogleUserResult} from './types';
import { users } from '../schema';
import { eq } from "drizzle-orm";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'; 
import * as argon2 from "argon2";
import { EmailService } from './email.service';
import { SessionService } from './session.service';
import * as qs from 'qs';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TwoFAservice } from './twoFA.service';

@Injectable()
export class AuthService {
    constructor(
        private config: ConfigService,
        @Inject(DrizzleAsyncProvider)
        private readonly database: NodePgDatabase<typeof schema>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly sessionService: SessionService,
        private readonly emailService: EmailService,
        private readonly httpService: HttpService,
        private twoFaservice: TwoFAservice
      ){}
    

      async signin(dto: AuthDto ,ipAddress : string ,device : string) :  Promise<{ status: number; message: string; sessionId: string }| { status: number; message: string; sessionId?: undefined }> {
        const email = dto.email;
        const pwd = dto.password;
        const userData = await this.database
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)
          .then((userData) => userData[0]);
    
        if (!userData) return { status: 0, message: "User data is not correct" };

        if(userData.is2FAactivated) return await this.twoFaservice.email2FA(userData.email,device,ipAddress);


        if (!(await argon2.verify(userData.hashedpwd as string, pwd)))
       return { status: 0, message: "User data is not correct" };
          console.log(userData)
        const sessionId = await this.sessionService.createSession(userData.id,ipAddress,device);
        console.log(sessionId)
        return {
          status: 1,message: "u r signed in",sessionId :sessionId
        };

 }
 async signup(dto: AuthDto ,ipAddress : string ,device : string) {
  const userData = await this.database
  .select()
  .from(users)
  .where(eq(users.email, dto.email))
  .limit(1)
  .then((userData) => userData[0]);
  if (userData) return { status: 0, message: "email already exists" };

    const user = {
      email : dto.email,
      hashedpwd : await argon2.hash(dto.password)
    }
    try {
    const userData = await this.database
    .insert(schema.users)
    .values([user])
    .returning()
    .then((userData) => userData[0]);
    
    const sessionId = await this.sessionService.createSession(userData.id,ipAddress,device);
    await this.emailService.confirmEmail(dto.email,sessionId)
     return {status : 1, message : "signup successful",sessionId : sessionId}

    }catch(error) {
      return {status : -1 , message : "error signing up"}
    }
 }



 async googleAuth(code : string,ipAddress : string ,device : string){
  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code,
    client_id: this.config.get("GOOGLE_CLIENT_ID"),
    client_secret: this.config.get("GOOGLE_CLIENT_SECRET"),
    redirect_uri: this.config.get("GOOGLE_OAUTH_REDIRECT_URL"),
    grant_type: "authorization_code",
  };
  console.log(values)
  //console.log("qs:", qs);
console.log("qs.stringify exists?", typeof qs.stringify);

  try {
      const res= await firstValueFrom(this.httpService.post<GoogleTokensResult>(
      url,
      qs.stringify(values),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    ));
    const tokenResult: GoogleTokensResult= res.data;
    console.log("tokens r heree !!")


     const res1 = await firstValueFrom(this.httpService.get<GoogleUserResult>(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokenResult.access_token}`,
      {
        headers: {
          Authorization: `Bearer ${tokenResult.id_token}`,
        },
      }
    ));
    const googleUser : GoogleUserResult=res1.data;
    console.log("user data is here !!")
    if (!googleUser.verified_email) {
      return {status : -1 , message : "could not sign in using google oauth"}
    }



    const userData = await this.database
    .select()
    .from(users)
    .where(eq(users.email, googleUser.email))
    .limit(1)
    .then((userData) => userData[0]);
    if(!userData){
      const dto :AuthDto={
        email : googleUser.email,
        password : this.config.get("OAUTH_PWD")as string
      }
      return this.signup(dto ,ipAddress  ,device )
    }
    const sessionId = await this.sessionService.createSession(userData.id,ipAddress,device);
    console.log(sessionId)
    return {
      status: 1,message: "u r signed in",sessionId :sessionId
    };











    return res1.data;



  } catch (error: any) {
    return {status : -1 , message : "could not sign in using google oauth"}
  }





 }





}






