import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'; 

import { v4 as uuidv4 } from 'uuid';
import {  cacheData} from './Cashtypes';


@Injectable()
export class SessionService {

    constructor(
        private config: ConfigService,
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
          
          if(value.ipAddress !=  ipad ||value.source != device){
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
        }
        console.log("caching . . . ")
        await this.cacheManager.set(userid, sessionId,5*60*60*1000);
        await this.cacheManager.set(sessionId, session,5*60*60*1000);
        console.log("cached")
        return sessionId;
      
      }

    }