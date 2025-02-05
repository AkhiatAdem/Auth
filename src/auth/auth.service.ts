import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from "../schema";
import { AuthDto } from './auth.dto';
import { users } from '../schema';
import { eq } from "drizzle-orm";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'; 
import { MailerService } from "@nestjs-modules/mailer";
import { v4 as uuidv4 } from 'uuid';
import * as argon2 from "argon2";
import { Session } from 'inspector/promises';

@Injectable()
export class AuthService {

    constructor(
        private config: ConfigService,
        private readonly mailService: MailerService,
        @Inject(DrizzleAsyncProvider)
        private readonly database: NodePgDatabase<typeof schema>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
      ) {}
    
      async verifySession(sessionId : string,ipad:string,device :string){
        const value = await this.cacheManager.get<cacheData>(sessionId);
        if(!value){
          return {
            status : 0,
            message : "session not valid"
          }
        }else{
          
          if(value.ipAddress !=  ipad ||value.source != device || isSessionExpired(value)){
            await this.cacheManager.del(sessionId);
            await this.cacheManager.del(value.userId);
            return {
              status : 0,
              message : "session not valid"
            }
          }
          return {
            status : 1,
            message : "session valid"
          }
        }
      }





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
        const sessionId = await this.createSession(userData.id,ipAddress,device);
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
    
     const sessionId = await this.createSession(userData.id,ipAddress,device);
     await this.confirmEmail(dto.email,userData.id);
     return {status : 1, message : "signup successful",sessionId : sessionId }


    }catch(error) {
      return {status : -1 , message : "error signing up"}
    }
 }

 async confirmEmail(email :string,id :string){
  const title = `email confirmation `;
  const message = 'your confirmation link http://localhost:3000/verify?id='+id;
  this.mailService.sendMail({
    from: "gdg website<gdgwebsitetest@gmail.com>",
    to: email,
    subject: title,
    text: message,
  });

 }



  async createSession (userid : string,ipAddress : string ,device : string ) : Promise<string>{
  const prevSessionId = await this.cacheManager.get<string>(userid)
  if(prevSessionId){
    console.log("destroying the old session");
    await this.cacheManager.del(userid);
    await this.cacheManager.del(prevSessionId);
  }
  const sessionId = uuidv4();
  const session = {
    userId:userid,
    ipAddress : ipAddress,
    source : device,
    lastActive : Date.now(),
    expiresAt : Date.now()+5*60*60*1000,
  }
  console.log("caching . . . ")
  await this.cacheManager.set(userid, sessionId);
  await this.cacheManager.set(sessionId, session);
  console.log("cached")
  return sessionId;

}




}

 export type cacheData = {
  userId : string;
  ipAddress: string;
  source: string;
  lastActive: number;
  expiresAt: number;
};

function isSessionExpired(value: cacheData): boolean {
  if(value.expiresAt<Date.now() || value.lastActive < Date.now()-(1*60*60*1000)){
    return true;
  }
  return false;
}
