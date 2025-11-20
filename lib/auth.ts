import NextAuth from 'next-auth';
import { authOptions } from './auth-options';

/**
 * NextAuth auth 函數
 * 用於在 API routes 和 Server Components 中獲取 session
 */
let authHandler;
try {
  authHandler = NextAuth(authOptions);
} catch (error) {
  console.error('[NextAuth] 初始化失敗:', error);
  // 提供一個安全的 fallback，避免應用崩潰
  authHandler = {
    auth: async () => null,
  };
}

export const { auth } = authHandler;

