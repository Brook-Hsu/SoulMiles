/**
 * NextAuth 型別擴展
 * 擴展預設的 Session 和 User 型別以包含自定義欄位
 */

import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      coin?: number;
      IsActive?: boolean;
      Google_Oath?: string | null;
      UserName?: string | null;
      Field?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    coin?: number;
    IsActive?: boolean;
    Google_Oath?: string | null;
    UserName?: string | null;
    Field?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    id?: string;
  }
}

