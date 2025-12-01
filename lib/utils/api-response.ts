/**
 * 統一的 API 回應格式工具
 * 提供標準化的成功和錯誤回應格式
 */

import { NextResponse } from 'next/server';

/**
 * API 成功回應
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * API 錯誤回應
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 建立成功回應
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * 建立錯誤回應
 */
export function errorResponse(
  error: string,
  status: number = 400,
  details?: string,
  code?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
      ...(code && { code }),
    },
    { status }
  );
}

/**
 * 常見的錯誤回應
 */
export const ApiErrors = {
  UNAUTHORIZED: () => errorResponse('未登入', 401, undefined, 'UNAUTHORIZED'),
  FORBIDDEN: () => errorResponse('無權限', 403, undefined, 'FORBIDDEN'),
  NOT_FOUND: (resource: string = '資源') =>
    errorResponse(`${resource}不存在`, 404, undefined, 'NOT_FOUND'),
  BAD_REQUEST: (message: string = '請求參數錯誤') =>
    errorResponse(message, 400, undefined, 'BAD_REQUEST'),
  INTERNAL_ERROR: (message: string = '伺服器錯誤') =>
    errorResponse(message, 500, undefined, 'INTERNAL_ERROR'),
  DATABASE_ERROR: () =>
    errorResponse('資料庫暫時無法連接', 503, undefined, 'DATABASE_ERROR'),
};

