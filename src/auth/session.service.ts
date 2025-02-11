import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'; 

import { v4 as uuidv4 } from 'uuid';
import {  cacheData, sessionData} from './types';
//import { Session } from 'inspector/promises';


@Injectable()
export class SessionService {

    constructor(
        private config: ConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
      ) {}


      async verifySession(sessionId : string,ipAddress:string,device :string){
        const value = await this.cacheManager.get<cacheData>(sessionId);
        if(!value){
          return {
            status : 0,
            message : "session not valid"
          }
        }
          if(value.ipAddress !=  ipAddress || value.source != device){
            await this.cacheManager.del(sessionId);
            if(await this.cacheManager.get<sessionData>(value.userId+ipAddress))
              await this.cacheManager.del(value.userId+ipAddress);
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






      
      async createSession (userid : string,ipAddress : string ,source : string ,rememberMe:boolean ) : Promise<string>{
        const dupSession: sessionData|null = await this.cacheManager.get<sessionData>(userid+ipAddress);
        console.log("creating session")
        if(dupSession){
          console.log("destroying old session");
          await this.cacheManager.del(userid+ipAddress);
          await this.cacheManager.del(dupSession.sessionId);
        }
        const sessionId = uuidv4();
        const session : cacheData= {
          userId:userid,
          lastActive:Date.now(),
          source,
          ipAddress
        }
        console.log("caching .... ")
        await this.cacheManager.set(sessionId, session,rememberMe?10*60*60*1000:5*60*60*1000);
        await this.cacheManager.set(userid+ipAddress, {sessionId,ipAddress},rememberMe?10*60*60*1000:5*60*60*1000);
        console.log("cached")
        return sessionId;
      }



   async logoutDevice(deviceSession: string) {
    const value = await this.cacheManager.get<cacheData>(deviceSession);
    if(!value){
      return {
        status : 0,
        message : "session does not exist"
      }
    }
    await this.cacheManager.del(deviceSession);
    await this.cacheManager.del(value.userId+value.ipAddress);
        return {
          status : 1,
          message : "logout successful"
          } 
      }
      
 


 }