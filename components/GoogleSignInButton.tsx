'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

interface GoogleSignInButtonProps {
  onModalClose?: () => void;
}

/**
 * GoogleSignInButton - Google 登入按鈕組件
 * 使用 NextAuth.js 的 signIn 函數觸發 Google 登入流程
 */
export default function GoogleSignInButton({ onModalClose }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // 關閉模態視窗
      if (onModalClose) {
        onModalClose();
      }
      
      // 使用 NextAuth 的 signIn 函數觸發 Google 登入
      await signIn('google', {
        callbackUrl: window.location.origin,
        redirect: true,
      });
    } catch (error) {
      console.error('Google 登入失敗:', error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full rounded-lg bg-[#fbbf24] py-2 text-sm font-semibold text-[#1b0e07] shadow-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? '登入中...' : '以 Google 免密碼登入'}
    </button>
  );
}

