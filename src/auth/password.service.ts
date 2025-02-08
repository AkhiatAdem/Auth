import { Injectable ,Inject} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/drizzle/drizzle.provider';
import * as schema from "../schema";
import { users } from '../schema';
import { eq } from "drizzle-orm";
import { Cache } from 'cache-manager'; 
import { MailerService } from "@nestjs-modules/mailer";
import { v4 as uuidv4 } from 'uuid';
import * as argon2 from "argon2";
import { cashedCode, cacheData} from './Cashtypes';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
@Injectable()
export class PasswordService {
  constructor(
        private readonly mailService: MailerService,
        @Inject(DrizzleAsyncProvider)
        private readonly database: NodePgDatabase<typeof schema>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async resetPassowrd(oldPwd:string,newPwd:string,device:string,sessionId:string,ipad:string){
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
        message:"user not found !"
      }
    }
  
    if(!(await argon2.verify(user.hashedpwd,oldPwd))){
      return {
        status:0,
        message:"old password is incorrect"
      }
    }
    const newhashedpwd = await argon2.hash(newPwd);
    await this.database.update(schema.users)
    .set({
      hashedpwd: newhashedpwd
    })
    .where(eq(users.id,value.userId))
  
    return {
      status:1,
      message:"passowrd reseted succesfully"
    }
  
  }

  async forgotPwd(email:string , device:string,ipad:string){

    const resetCounter = await this.cacheManager.get<number>(`pwdResetCounter_${email}`) || 0;
  
    if(resetCounter >= 3){
      return {
        status:0,
        message:"too many requests"
      }
    }
  
    await this.cacheManager.set(`pwdResetCounter_${email}`,resetCounter+1)
  
    const user = await this.database.select().
    from(schema.users).
    where(eq(users.email,email)).
    then(data=>data[0])
  
    if(!user){
      return {
        status: 404,
        message: "user with this email does not exist"
      }
    }
    const resetPwdCode = Math.floor(100000 + Math.random() * 900000).toString();
  
    const title = `your password reset code`;
    const message = `the code : ${resetPwdCode}`;
    await this.mailService.sendMail({
      from: "gdg website<gdgwebsitetest@gmail.com>",
      to: email,
      subject: title,
      text: message,
    });
  
      const prevSessionId = await this.cacheManager.get<string>(email)
      if(prevSessionId){
        console.log("destroying the old session");
        await this.cacheManager.del(email);
        await this.cacheManager.del(prevSessionId);
      }
      const sessionId = uuidv4();
      const session = {
        code:resetPwdCode,
        email:email,
        ipAddress : ipad,
        source : device
      }
      await this.cacheManager.set(email, sessionId,1000*60*10);
      await this.cacheManager.set(sessionId, session,1000*60*10);
      return {status:1,message:"done",session:sessionId};
    }
  
    async checkCode(code:string,newPwd:string,device:string,ipad:string,sessionId:string)
    {
      const value = await this.cacheManager.get<cashedCode>(sessionId);
      if(!value){
        return {
          status:0,
          message:"session not valid"
        }
      }
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
      const hashedPwd = await argon2.hash(newPwd);
  
      await this.database.update(schema.users).
      set({
        hashedpwd:hashedPwd
      }).
      where(eq(users.email,value.email))
  
      await this.cacheManager.del(sessionId);
      await this.cacheManager.del(value.email);
  

      return {
        status:1,
        message:"password changed succefully"
      }
    }
}