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


  export type GoogleTokensResult = {
    access_token: string;
    expires_in: Number;
    refresh_token: string;
    scope: string;
    id_token: string;
  }
  
  export type  GoogleUserResult = {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
  }
  