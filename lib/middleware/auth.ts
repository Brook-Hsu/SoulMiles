/**
 * 統一的認證中間件
 * 提供標準化的認證檢查和用戶資訊獲取
 */

import { auth } from '../auth';
import { NextRequest } from 'next/server';
import { ApiErrors } from '../utils/api-response';

/**
 * 認證結果
 */
export interface AuthResult {
  userId: string;
  userEmail: string;
  userName?: string | null;
}

/**
 * 檢查認證並獲取用戶資訊
 * @param request NextRequest 物件
 * @returns 認證結果或 null（如果未認證）
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthResult> {
  const session = await auth();

  if (!session || !session.user?.email) {
    throw ApiErrors.UNAUTHORIZED();
  }

  const userId = session.user.id;
  if (!userId) {
    throw ApiErrors.UNAUTHORIZED();
  }

  return {
    userId,
    userEmail: session.user.email,
    userName: session.user.name || session.user.UserName || null,
  };
}

/**
 * 可選的認證檢查（不拋出錯誤）
 * @param request NextRequest 物件
 * @returns 認證結果或 null（如果未認證）
 */
export async function optionalAuth(
  request: NextRequest
): Promise<AuthResult | null> {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}

/**
 * 從 session 獲取用戶 ID（不拋出錯誤）
 * @returns 用戶 ID 或 null
 */
export async function getUserId(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

