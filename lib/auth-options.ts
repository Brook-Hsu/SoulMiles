import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import { prisma } from './prisma';
import './types/auth'; // 載入型別擴展

/**
 * NextAuth 配置選項
 * 包含所有認證相關的配置，包括 providers, callbacks, events 等
 */

// 輔助函數：檢查 prisma 是否可用
function isPrismaAvailable(): boolean {
  return (
    process.env.DATABASE_URL !== undefined &&
    prisma !== undefined &&
    typeof prisma.user !== 'undefined' &&
    typeof prisma.account !== 'undefined' &&
    typeof prisma.user.findUnique === 'function'
  );
}

// Google OAuth 憑證
// 從環境變數讀取，不提供 fallback 值以確保安全性
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Facebook OAuth 憑證
// 從環境變數讀取，不提供 fallback 值以確保安全性
const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;

// 只有在 DATABASE_URL 存在且 prisma 有效時才初始化 PrismaAdapter
// 如果沒有 DATABASE_URL 或 prisma 初始化失敗，使用 undefined（NextAuth v5 支持沒有 adapter）
let adapter: Adapter | undefined;
try {
  if (isPrismaAvailable()) {
    adapter = PrismaAdapter(prisma) as Adapter;
  }
} catch (error) {
  console.error('[NextAuth Config] PrismaAdapter 初始化失敗:', error);
  adapter = undefined;
}

// 初始化 providers 陣列
const providers: any[] = [];

// 只有在憑證存在時才添加 Google Provider
if (googleClientId && googleClientSecret) {

  // 初始化 Google Provider
  // 確保使用正確的配置格式
  const googleProvider = Google({
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    // 移除可能導致問題的 authorization 參數，使用默認配置
  });
  
  providers.push(googleProvider);
} else {
  // 在開發環境中輸出警告（僅在服務器端）
  if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    console.warn('[NextAuth Config] Google OAuth 憑證未配置。請檢查 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET 環境變數。');
  }
}

// 只有在憑證存在時才添加 Facebook Provider
if (facebookClientId && facebookClientSecret) {

  // 初始化 Facebook Provider
  const facebookProvider = Facebook({
    clientId: facebookClientId,
    clientSecret: facebookClientSecret,
  });
  
  providers.push(facebookProvider);
} else {
  // 在開發環境中輸出警告（僅在服務器端）
  if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    console.warn('[NextAuth Config] Facebook OAuth 憑證未配置。請檢查 FACEBOOK_CLIENT_ID 和 FACEBOOK_CLIENT_SECRET 環境變數。');
  }
}

// 驗證 providers 不為空（只有在需要認證功能時才驗證）
// 注意：如果沒有 providers，NextAuth 仍然可以初始化，但無法進行登入

export const authOptions = {
  adapter,
  providers,
  pages: {
    signIn: '/',
  },
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
  // 移除 logger 配置以符合 NextAuth v5 API
  // NextAuth v5 會使用默認的 logger 行為
  events: {
    async createUser({ user }) {
      // 當新用戶被創建時，確保 OAuth 欄位被正確設置
      // 只有在 prisma 可用時才執行資料庫操作
      if (!isPrismaAvailable()) {
        return;
      }

      try {
        if (user.email) {
          // 查找對應的 Account 以獲取 providerAccountId
          const accounts = await prisma.account.findMany({
            where: {
              userId: user.id,
            },
          });

          // 更新用戶的 OAuth 欄位（支援 Google 和 Facebook）
          const updateData: any = {
            coin: 0,
            IsActive: true,
            Update_time: new Date(),
          };

          const googleAccount = accounts.find((acc) => acc.provider === 'google');
          if (googleAccount) {
            updateData.Google_Oath = googleAccount.providerAccountId;
          }

          // 如果有 Facebook 帳號，也可以在這裡處理（如果需要 Facebook_Oath 欄位）
          // const facebookAccount = accounts.find((acc) => acc.provider === 'facebook');
          // if (facebookAccount) {
          //   updateData.Facebook_Oath = facebookAccount.providerAccountId;
          // }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        }
      } catch (error) {
        console.error('初始化新用戶資料失敗:', error);
      }
    },
    async linkAccount({ account, user }) {
      // 當帳號被連結時，更新對應的 OAuth 欄位
      // 只有在 prisma 可用時才執行資料庫操作
      if (!isPrismaAvailable()) {
        return;
      }

      try {
        if (account.providerAccountId) {
          const updateData: any = {
            Update_time: new Date(),
          };

          // 根據 provider 更新對應的欄位
          if (account.provider === 'google') {
            updateData.Google_Oath = account.providerAccountId;
          }
          // 如果有 Facebook_Oath 欄位，可以在這裡處理
          // else if (account.provider === 'facebook') {
          //   updateData.Facebook_Oath = account.providerAccountId;
          // }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          if (process.env.NODE_ENV === 'development') {
          }
        }
      } catch (error) {
        console.error(`更新用戶 ${account.provider} OAuth 失敗:`, error);
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // 如果使用 PrismaAdapter，NextAuth 會自動處理帳號連結
      // 但我們可以在這裡添加額外的邏輯來確保相同 email 的帳號被正確連結
      
      if (!isPrismaAvailable() || !user.email) {
        return true; // 允許登入，讓 PrismaAdapter 處理
      }

      try {
        // 檢查是否存在相同 email 的用戶
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: {
            accounts: {
              select: { provider: true },
            },
          },
        });

        if (existingUser && account) {
          // 檢查該 provider 的帳號是否已經連結
          const existingAccount = existingUser.accounts.find(
            (acc) => acc.provider === account.provider
          );

          // 如果 email 已存在但該 provider 的帳號尚未連結
          // PrismaAdapter 會自動處理連結
        }
      } catch (error) {
        console.error('[NextAuth] signIn callback 錯誤:', error);
        // 即使出錯也允許登入，讓 PrismaAdapter 處理
      }

      return true; // 允許登入
    },
    async jwt({ token, user, account }) {
      // 在首次登入時，user 對象可用
      // 將 user id 保存到 token 中
      if (user) {
        token.userId = user.id;
        token.id = user.id;
      }
      // 如果使用 database adapter，token.sub 可能已經包含 user id
      if (token.sub && !token.userId) {
        token.userId = token.sub;
        token.id = token.sub;
      }
      return token;
    },
    async session({ session, token, user }) {
      // NextAuth v5 使用 database adapter 時，session callback 可能同時有 user 和 token
      // 優先使用 user.id（database adapter 提供），其次使用 token
      let userId: string | undefined;
      
      if (user?.id) {
        // 使用 database adapter 時，user 對象可用
        userId = user.id;
      } else if (token?.userId || token?.id || token?.sub) {
        // 如果沒有 user 對象，從 token 中獲取
        userId = (token.userId || token.id || token.sub) as string;
      } else if (session?.user?.email && isPrismaAvailable()) {
        // 如果都沒有，從 email 查詢 database
        // 只有在 prisma 可用時才執行資料庫操作
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
          });
          if (dbUser) {
            userId = dbUser.id;
          }
        } catch (error) {
          console.error('從 email 查詢用戶失敗:', error);
        }
      }
      
      if (userId && session.user) {
        // 只有在 prisma 可用時才執行資料庫操作
        if (isPrismaAvailable()) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                coin: true,
                IsActive: true,
                Google_Oath: true,
                UserName: true,
                Field: true,
              },
            });

            if (dbUser) {
              // 擴展 session.user 以包含自定義欄位
              session.user.id = userId;
              session.user.coin = dbUser.coin;
              session.user.IsActive = dbUser.IsActive;
              session.user.Google_Oath = dbUser.Google_Oath;
              session.user.UserName = dbUser.UserName;
              session.user.Field = dbUser.Field;
            } else {
              // 即使找不到 dbUser，也要設置 user.id
              session.user.id = userId;
            }
          } catch (error) {
            console.error('獲取用戶資料失敗:', error);
            // 即使出錯，也要設置 user.id
            session.user.id = userId;
          }
        } else {
          // 如果 prisma 不可用，至少設置 user.id
          session.user.id = userId;
        }
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

