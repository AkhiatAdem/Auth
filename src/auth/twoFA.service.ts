import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from "../schema";
import { users } from '../schema';
import { eq } from "drizzle-orm";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'; 
import { SessionService } from './session.service';
import { HttpService } from '@nestjs/axios';
import { MailerService } from '@nestjs-modules/mailer';
import { v4 as uuidv4 } from 'uuid';
import { sessionData,cashedCode,cacheData } from './types';
@Injectable()

export class TwoFAservice{
    constructor(
        private config: ConfigService,
        @Inject(DrizzleAsyncProvider)
        private readonly database: NodePgDatabase<typeof schema>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly sessionService: SessionService,
        private readonly mailService: MailerService,
      ){}


      async toggle2FA(sessionId:string,device:string,ipad:string){
        const value = await this.cacheManager.get<cacheData>(sessionId);
        if(!value){
          return {
            status:0,
            message:"session not valid"
          }
        }
      
        if((value.ipAddress != ipad )||value.source != device ){
          return {
            status:0,
            message: "Unauthorized"
          }
        }
      
        const user = await this.database.select().
        from(schema.users).
        where(eq(users.id,value.userId)).
        then(data=>data[0])


        if(!user){
            return {
                status:404,
                message:"user not found"
            }
        }

        await this.database.update(schema.users).set({
            is2FAactivated:!user.is2FAactivated
        })
        return {
            status:1,
            message:user.is2FAactivated ? "2fa is disabled succesfully":"2fa is enabled succesfully"
        }
      }


      async email2FA(email:string,device:string,ipad:string){
  
        const logincode = Math.floor(100000 + Math.random() * 900000).toString();
    
        const title = `login detected`;
        const message = `
        a ${device} tried to login to your account if thats you you can confirm the login with this code
        the code : ${logincode}
        `;
        await this.mailService.sendMail({
        from: "gdg website<gdgwebsitetest@gmail.com>",
        to: email,
        subject: title,
        text: message,
        });
        const sessionId = uuidv4();
        const session: cashedCode = {
            code:logincode,
            email:email,
            ipAddress : ipad,
            device : device
        }
        await this.cacheManager.set(email, sessionId,1000*60*10);
        await this.cacheManager.set(sessionId, session,1000*60*10);
        return {status:1,message:"done",session:sessionId};

      }

      async confirmCode2FA(code:string,ipad:string,device:string,sessionId:string){


        const value = await this.cacheManager.get<cashedCode>(sessionId);
        if(!value){
            return {
            status:0,
            message:"session not valid"
            }
        }
        console.log(value)
        if((value.ipAddress != ipad )||value.device != device ){
            return {
            status:0,
            message: "Unauthorized"
            }
        }
        if(code != value.code){
            return {
            status:0,
            message:"wrong code !"
            }
        }
        const userData = await this.database
            .select()
            .from(users)
            .where(eq(users.email, value.email))
            .limit(1)
            .then((userData) => userData[0]);

        await this.sessionService.createSession(userData.id,ipad,device);
        return {
            status:1,
            message: "you are logged in now"
        }
      }

      async loggedInDevices(sessionId:string,ipad:string,device:string){
        const value = await this.cacheManager.get<cacheData>(sessionId);
        if(!value){
            return {
            status:0,
            message:"session not valid"
            }
        }
        if((value.ipAddress != ipad )||value.source != device ){
            return {
            status:0,
            message: "Unauthorized"
            }
        }

        const devices: sessionData[] = await this.cacheManager.get<sessionData[]>(value.userId) || [];

        return {
            status:1,
            devices:devices
        }
      }

}