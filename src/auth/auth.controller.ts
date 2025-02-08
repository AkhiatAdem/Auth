import { Body, Controller, Param, Post, Query, Req, Res,Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, checkCodeDto } from './auth.dto';
import { Response } from "express";
import { Request } from 'express';
import { EmailService } from './email.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import validateRequest from './functions';
import { TwoFAservice } from './twoFA.service';
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService,
                private passowrdService:PasswordService,
                private emailService: EmailService,
                private sessionService: SessionService,
                private twofaService:TwoFAservice
       ){}



    @Post("test")
    async test( @Res() res: Response,@Req() req: Request) {
      const data : {sessionId:string,device:string,ipaddress:string} | null = validateRequest(req,res);
      if(!data)return;
      const result  =  await this.sessionService.verifySession(data.sessionId,data.ipaddress,data.device)
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
        const data : {sessionId:string,device:string,ipaddress:string} | null = validateRequest(req,res);
        if(!data)return;
          const result = await this.passowrdService.resetPassowrd(dto.oldPwd,dto.newPwd,data.device,data.sessionId,data.ipaddress);
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
        const data : {sessionId:string,device:string,ipaddress:string} | null = validateRequest(req,res);
        if(!data)return;
         console.log("ip & device code controller: "+data.ipaddress+"  "+data.device)

         const result = await this.passowrdService.checkCode(dto.code,dto.newPwd,data.device,data.ipaddress,data.sessionId)
         return res.send(result)
      }





      @Get('google')
      async googleAuth(@Res() res: Response,@Req() req: Request ){

        const device = req.headers['user-agent']
        var ipaddress=req.ip??req.headers['x-forwarded-for'];
        ipaddress = Array.isArray(ipaddress) ? ipaddress[0] : ipaddress;
        if(!ipaddress || !device)
          return res.send({
            status : -1,
            message : "bad request"
         })
        const code = req.query.code as string;
        const result = await this.authService.googleAuth(code,ipaddress,device);
        return res.send(result)
      }





      @Get('2fa')
      async toggle2FA(@Res() res: Response,@Req() req: Request){
        const data : {sessionId:string,device:string,ipaddress:string} | null = validateRequest(req,res);
        if(!data)return;
        const result = await this.twofaService.toggle2FA(data.sessionId,data.device,data.ipaddress);
        return res.send(result)
      }




      @Post('code2FA')
      async confirmCode2FA(@Res() res: Response,@Req() req: Request,@Body() dto : {code:string}){
        const data : {sessionId:string,device:string,ipaddress:string} | null = validateRequest(req,res);
        if(!data)return -1;
        const result =  await this.twofaService.confirmCode2FA(dto.code,data.ipaddress,data.device,data.sessionId);
        return res.send(result)
      }



      
      @Get('loggedDevices')
      async loggedIndevices(@Res() res: Response,@Req() req: Request){
        const data : {sessionId:string,device:string,ipaddress:string} | null = validateRequest(req,res);
        if(!data)return -1;
        const result = await this.twofaService.loggedInDevices(data.sessionId,data.ipaddress,data.device)
        return res.send(result)

      }



}
