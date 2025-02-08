import {cacheData} from "./types"
import { Request,Response } from "express";

// export default function isSessionExpired(value: cacheData): boolean {
//     if(value.expiresAt<Date.now() || value.lastActive < Date.now()-(1*60*60*1000)){
//       return true;
//     }
//     return false;
//   }

export default function validateRequest(req: Request,res : Response){

    const sessionId= Array.isArray(req.headers.session) ? req.headers.session[0] : req.headers.session;
      const device = req.headers['user-agent']
      var ipaddress=req.ip??req.headers['x-forwarded-for'];
      ipaddress = Array.isArray(ipaddress) ? ipaddress[0] : ipaddress;
      if(!sessionId || !ipaddress || !device){
         res.send({
            status : -1,
            message : "access not allowed"
         })
         return null
      }
        
      
       return {sessionId,device,ipaddress}
}