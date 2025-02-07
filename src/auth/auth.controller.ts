import { Body, Controller, Param, Post, Query, Req, Res,Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, checkCodeDto } from './auth.dto';
import { Response } from "express";
import { Request } from 'express';
import { EmailService } from './email.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService,
                private passowrdService:PasswordService,
                private emailService: EmailService,
                private sessionService: SessionService
       ){}

    @Post("test")
    async test( @Res() res: Response,@Req() req: Request) {
      const sessionId= Array.isArray(req.headers.session) ? req.headers.session[0] : req.headers.session;
      const device = req.headers['user-agent']
      var ipaddress=req.ip??req.headers['x-forwarded-for'];
      ipaddress = Array.isArray(ipaddress) ? ipaddress[0] : ipaddress;
      if(!sessionId || !ipaddress || !device)
        return res.send({
          status : -1,
          message : "access not allowed"
       })
      console.log(sessionId)  
      
      const result  =  await this.sessionService.verifySession(sessionId,ipaddress,device)
      return res.send(result);
    }

    @Post("signin")
    async signin(@Body() dto: AuthDto, @Res() res: Response,@Req() req: Request) {

      const device = req.headers['user-agent']
      var ipaddress=req.ip??req.headers['x-forwarded-for'];
      ipaddress = Array.isArray(ipaddress) ? ipaddress[0] : ipaddress;
      if(!ipaddress || !device)
        return res.send({
          status : -1,
          message : "bad request"
       })


      const signinData = await this.authService.signin(dto,ipaddress,device);
      if (!signinData.sessionId) return res.send(signinData);
      const { sessionId, ...response } = signinData;
      res.cookie("session", sessionId, { httpOnly: true, secure: true });
      return res.send(response);
      return 1;
    }

    @Post('signup')
    async signup(@Body() dto : AuthDto, @Res() res: Response,@Req() req: Request) {  
        console.log(
            dto
        )
        const device = req.headers['user-agent']
        var ipaddress=req.ip??req.headers['x-forwarded-for'];
        ipaddress = Array.isArray(ipaddress) ? ipaddress[0] : ipaddress;
        if(!ipaddress || !device)
          return res.send({
            status : -1,
            message : "bad request"
         })
  
  


       const signupData = await this.authService.signup(dto,ipaddress,device);
        if (!signupData.sessionId) return res.send(signupData);
       const { sessionId, ...response } = signupData;
       res.cookie("session", sessionId, { httpOnly: true, secure: true });
       return res.send(response);
       return 1;
    }



    @Get('cEmail')
    async confirmEmail(@Query('id') id:string){
      if(!id){
        return {
          status:404,
          message:"there is nothing here !"
        }
      }
      return await this.emailService.checkEmailSession(id)
      }

      @Post('resetPassword')
      async resetPassword(@Res() res: Response,@Req() req: Request , @Body() dto : {oldPwd:string,newPwd:string}){
        const sessionId= Array.isArray(req.headers.session) ? req.headers.session[0] : req.headers.session;
        const device = req.headers['user-agent']
        var ipaddress=req.ip??req.headers['x-forwarded-for'];
        ipaddress = Array.isArray(ipaddress) ? ipaddress[0] : ipaddress;
        if(!sessionId || !ipaddress || !device)
          return res.send({
            status : -1,
            message : "access not allowed"
         })

          const result = await this.passowrdService.resetPassowrd(dto.oldPwd,dto.newPwd,device,sessionId,ipaddress);
          return res.send(result)
      }

      @Post('forgotPwd')
      async forgotPwd(@Res() res: Response,@Req() req: Request ,@Body() dto: {email:string}){
        const device = req.headers['user-agent']
        var ipaddress=req.ip??req.headers['x-forwarded-for'];
        ipaddress = Array.isArray(ipaddress) ? ipaddress[0] : ipaddress;
         if(!ipaddress || !device)
          return res.send({
            status : -1,
            message : "access not allowed"
         })
         console.log("ip & device mail sender : "+ipaddress+"  "+device)
         const userdata = await  this.passowrdService.forgotPwd(dto.email,device,ipaddress);
         if (!userdata.session) return res.send(userdata);
         const { session, ...response } = userdata;
         res.cookie("session", session, { httpOnly: true, secure: true });
         return res.send(response);
      }

      @Post('checkCode')
      async checkCode(@Res() res: Response,@Req() req: Request ,@Body() dto: checkCodeDto){
        const sessionId= Array.isArray(req.headers.session) ? req.headers.session[0] : req.headers.session;
        const device = req.headers['user-agent']
        var ipaddress=req.ip??req.headers['x-forwarded-for'];
        ipaddress = Array.isArray(ipaddress) ? ipaddress[0] : ipaddress;
         if(!ipaddress || !device || !sessionId)
          return res.send({
            status : -1,
            message : "access not allowed"
         })
         console.log("ip & device code controller: "+ipaddress+"  "+device)

         const result = await this.passowrdService.checkCode(dto.code,dto.newPwd,device,ipaddress,sessionId)
         return res.send(result)
      }


}
