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
        }else{
          if(value.ipAddress !=  ipAddress || value.source != device){
            await this.cacheManager.del(sessionId);
            const sessions :sessionData[]= (await this.cacheManager.get<sessionData[]>(value.userId))??[]
            const index = sessions.findIndex(session => session.ipAddress === ipAddress);
            if(index !== undefined && index !== -1){
              sessions.splice(index, 1);
              await this.cacheManager.set(value.userId, [sessions,{sessionId,ipAddress}],5*60*60*1000);
            } 
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






      
      async createSession (userid : string,ipAddress : string ,source : string ) : Promise<string>{
        const sessions: sessionData[] = await this.cacheManager.get<sessionData[]>(userid) ?? [];
        const dupSession =sessions.find(session => session.ipAddress === ipAddress)
        if(dupSession){
          const index = sessions.findIndex(session => session.ipAddress === ipAddress);
          sessions.splice(index, 1);
          console.log("destroying the old session");
          await this.cacheManager.del(dupSession.sessionId);
        }
        const sessionId = uuidv4();
        const session : cacheData= {
          userId:userid,
          lastActive:Date.now(),
          source,
          ipAddress
        }
        console.log("caching . . . ")
        await this.cacheManager.set(sessionId, session,5*60*60*1000);
        await this.cacheManager.set(userid, [sessions,{sessionId,ipAddress}],5*60*60*1000);
        console.log("cached")
        return sessionId;
      
      }

    }