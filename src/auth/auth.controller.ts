import { Body, Controller, Post, Query, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './auth.dto';
import { Response } from "express";
import { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

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
      
      const result  =  await this.authService.verifySession(sessionId,ipaddress,device)
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
          message : "access not allowed"
       })


      const signinData = await this.authService.signin(dto,ipaddress,device);
      if (!signinData.sessionId) return res.send(signinData);
      const { sessionId, ...response } = signinData;
      res.cookie("session", sessionId, { httpOnly: true, secure: true });
      return res.send(response);
    }
}
