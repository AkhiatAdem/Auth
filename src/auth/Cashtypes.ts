export type cacheData = {
    userId : string;
    lastActive: number;
    source: string;
    ipAddress: string;

  };
  export type sessionData = {
    sessionId :string;
    ipAddress: string;
  };
  export type cashedCode = {
    code:string,
    device:string,
    ipAddress:string,
    email:string
  };