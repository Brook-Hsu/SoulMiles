'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut, signIn } from 'next-auth/react';
import Modal from './Modal';
import GoogleSignInButton from './GoogleSignInButton';

const menuItems = [
  {
    label: '會員中心',
    description: '查看靈魂勳章與秘寶歷程',
  },
  {
    label: '訊息通知',
    description: '追蹤盟友動態與迷霧提醒',
  },
];

export default function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleSwitchAccount = async () => {
    await signOut({ redirect: false });
    await signIn('google', { callbackUrl: window.location.origin });
  };

  return (
    <>
      <header className="flex items-center justify-between rounded-full border border-[#f0d9b5]/30 bg-[#1c1422]/80 px-4 py-2 shadow-lg backdrop-blur">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-left"
        >
          <img 
            src="/images/routes/soulmiles.jpg" 
            alt="SoulMiles Logo" 
            className="h-9 w-9 rounded-full object-cover shadow-inner"
          />
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-[#f7e7c7]/70">Miles</p>
            <p className="text-xs text-[#f7e7c7]">迷霧儀錶板</p>
          </div>
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-full border border-[#f0d9b5]/30 bg-[#2a1c2f] p-2 text-[#f0d9b5] shadow-inner hover:text-white transition-colors"
          aria-label="member center"
          title="靈魂聖殿"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </button>
      </header>

      {isModalOpen && (
        <Modal
          title={session ? "靈魂聖殿" : "航海者的選擇"}
          subtitle={session ? `歡迎回來，${session.user?.name || '旅者'}` : "選擇你的下一步，靈魂不設限"}
          onClose={() => setIsModalOpen(false)}
          primaryAction={
            session ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#fbbf24]/30 bg-[#2b1a10]/70">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-[#fbbf24]">{session.user?.name || '用戶'}</p>
                    <p className="text-xs text-[#f7e7c7]/70">{session.user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSwitchAccount}
                  className="w-full rounded-lg bg-[#fbbf24] py-2 text-sm font-semibold text-[#1b0e07] shadow-lg hover:bg-[#f59e0b] transition-colors"
                >
                  換帳號
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full rounded-lg border border-[#fbbf24]/50 py-2 text-sm font-semibold text-[#f6d8a7] hover:border-[#fbbf24] transition-colors"
                >
                  登出
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <GoogleSignInButton onModalClose={() => setIsModalOpen(false)} />
                <button className="w-full rounded-lg border border-[#fbbf24]/50 py-2 text-sm font-semibold text-[#f6d8a7]">
                  以 Facebook 免密碼登入
                </button>
                <p className="text-center text-[0.7rem] text-[#f1e3c3]/60">
                  免密碼通行證，3 秒登艦
                </p>
              </div>
            )
          }
        >
          <div className="space-y-3">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.label === '會員中心') {
                    router.push('/member-center');
                    setIsModalOpen(false);
                  }
                }}
                className="w-full rounded-xl border border-[#fbbf24]/30 bg-[#2b1a10]/70 px-4 py-3 text-left hover:border-[#fbbf24] transition-colors"
              >
                <p className="text-sm font-semibold text-[#fbbf24]">{item.label}</p>
                <p className="text-xs text-[#f7e7c7]/70">{item.description}</p>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

