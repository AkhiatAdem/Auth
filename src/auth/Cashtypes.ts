export type cacheData = {
    userId : string;
    ipAddress: string;
    source: string;
    lastActive: number;
    expiresAt: number;
  };
  export type cashedCode = {
    code:string,
    newPwd:string,
    device:string,
    ipad:string,
    sessionId:string, 
    email:string
  };