import NextAuth from 'next-auth';
import { authOptions } from './auth-options';

/**
 * NextAuth auth 函數
 * 用於在 API routes 和 Server Components 中獲取 session
 */
export const { auth } = NextAuth(authOptions);

