import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from "../schema";
import { users } from '../schema';
import { eq } from "drizzle-orm";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'; 
import { MailerService } from "@nestjs-modules/mailer";
import {cacheData} from './types';

@Injectable()
export class EmailService {

    constructor(
        private config: ConfigService,
        private readonly mailService: MailerService,
        @Inject(DrizzleAsyncProvider)
        private readonly database: NodePgDatabase<typeof schema>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
      ) {}

      async confirmEmail(email :string,id :string){
        const title = `email confirmation `;
        const message = 'your confirmation link http://localhost:3000/auth/cEmail?id='+id;
        await this.mailService.sendMail({
          from: "gdg website<gdgwebsitetest@gmail.com>",
          to: email,
          subject: title,
          text: message,
        });
      
       }

       async  checkEmailSession(sessionId:string){

        const value = await this.cacheManager.get<cacheData>(sessionId);
        if(!value){
          return {
            status:0,
            message:"session not valid"
          }
        }
        const b = await this.database.
        update(schema.users).
        set({
          isEmailConfirmed: true
        }).where(eq(users.id,sessionId)).returning()
        console.log("b = " +b)
      
        return {
          status: 1,
          message: "Email is confirmed successfully"
        }; 
      }



    }