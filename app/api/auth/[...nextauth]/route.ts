import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth-options';

/**
 * NextAuth 請求處理器
 * 處理所有認證相關的 HTTP 請求（GET 和 POST）
 */

// 初始化 NextAuth 並解構 handlers
const { handlers } = NextAuth(authOptions);

/**
 * GET 請求處理器
 * 處理所有 GET 請求到 NextAuth 端點（如 /api/auth/session, /api/auth/signin/google 等）
 */
export const GET = handlers.GET;

/**
 * POST 請求處理器
 * 處理所有 POST 請求到 NextAuth 端點
 */
export const POST = handlers.POST;

