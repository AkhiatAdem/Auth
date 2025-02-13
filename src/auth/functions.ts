import {cacheData} from "./types"
import { Request,Response } from "express";

// export default function isSessionExpired(value: cacheData): boolean {
//     if(value.expiresAt<Date.now() || value.lastActive < Date.now()-(1*60*60*1000)){
//       return true;
//     }
//     return false;
//   }

export default function validateRequest(req: Request,res : Response,flag : boolean){

      const device = req.headers['user-agent']
      var ipaddress=req.ip??req.headers['x-forwarded-for'];
      ipaddress = Array.isArray(ipaddress) ? ipaddress[0] : ipaddress;
      if(!ipaddress || !device){
         res.send({
            status : -1,
            message : "bad request"
         })
         return null
      }
      if(flag){
         const sessionId= Array.isArray(req.headers.session) ? req.headers.session[0] : req.headers.session;
         if(!sessionId){
            res.send({
               status : -1,
               message : "access not allowed"
            })
            return null
         }
       return {sessionId,device,ipaddress}

      }
      return {device,ipaddress}
        
      
}