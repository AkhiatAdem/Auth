import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from "../schema";
import { AuthDto } from './auth.dto';
import { users } from '../schema';
import { eq } from "drizzle-orm";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'; 
import * as argon2 from "argon2";
import { EmailService } from './email.service';
import { SessionService } from './session.service';
@Injectable()
export class AuthService {
    constructor(
      private readonly sessionService: SessionService,
      private readonly emailService: EmailService,
        private config: ConfigService,
        @Inject(DrizzleAsyncProvider)
        private readonly database: NodePgDatabase<typeof schema>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
      ) {}
    

      async signin(dto: AuthDto ,ipAddress : string ,device : string) {
        const email = dto.email;
        const pwd = dto.password;
        const userData = await this.database
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)
          .then((userData) => userData[0]);
    
        if (!userData) return { status: 0, message: "User data is not correct" };
       // if (!(await argon2.verify(userData.hashedpwd as string, pwd)))
         // return { status: 0, message: "User data is not correct" };
        /////////////////////////////////////////////
        const sessionId = await this.sessionService.createSession(userData.id,ipAddress,device);
        console.log(sessionId)
        /////////////////////////////////////////
        return {
          status: 1,message: "User data is correct",sessionId :sessionId
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
     return {status : 1, message : "signup successful",sessionId : sessionId }

    }catch(error) {
      return {status : -1 , message : "error signing up"}
    }
 }
}






