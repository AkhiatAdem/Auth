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
        //if (!(await argon2.verify(userData.hashedpwd as string, pwd)))
         // return { status: 0, message: "User data is not correct" };
        const prevSessionId = await this.cacheManager.get<string>(userData.id)
        if(prevSessionId){
          console.log("destroying the old session");
          await this.cacheManager.del(userData.id);
          await this.cacheManager.del(prevSessionId);
        }
        const sessionId = uuidv4();
        const session = {
          userId:userData.id,
          ipAddress : ipAddress,
          source : device,
          lastActive : Date.now(),
          expiresAt : Date.now()+5*60*60*1000,
        }
        console.log("caching . . . ")
        await this.cacheManager.set(userData.id, sessionId);
        await this.cacheManager.set(sessionId, session);
        console.log("cached")
        return {
          status: 1,message: "User data is correct",sessionId :sessionId
        };

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
