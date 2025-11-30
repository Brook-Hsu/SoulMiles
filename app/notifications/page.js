'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // 如果未登入，導向首頁
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // 載入通知列表
  useEffect(() => {
    if (session?.user?.email) {
      loadNotifications();
      // 每 30 秒自動刷新
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('載入通知失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 標記通知為已讀
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        // 更新本地狀態
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('標記已讀失敗:', error);
    }
  };

  // 接受好友請求
  const handleAcceptFriend = async (notification) => {
    try {
      const response = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId: notification.related_id }),
      });

      if (response.ok) {
        await markAsRead(notification.id);
        await loadNotifications(); // 重新載入通知
        alert('好友請求已接受！');
      } else {
        const error = await response.json();
        alert(error.error || '接受好友請求失敗');
      }
    } catch (error) {
      console.error('接受好友請求失敗:', error);
      alert('接受好友請求失敗，請稍後再試');
    }
  };

  // 拒絕好友請求
  const handleRejectFriend = async (notification) => {
    try {
      const response = await fetch('/api/friends/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId: notification.related_id }),
      });

      if (response.ok) {
        await markAsRead(notification.id);
        await loadNotifications(); // 重新載入通知
        alert('好友請求已拒絕');
      } else {
        const error = await response.json();
        alert(error.error || '拒絕好友請求失敗');
      }
    } catch (error) {
      console.error('拒絕好友請求失敗:', error);
      alert('拒絕好友請求失敗，請稍後再試');
    }
  };

  // 格式化時間
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-TW');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen treasure-map-bg text-white flex items-center justify-center">
        <p className="text-soul-glow">載入中...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen treasure-map-bg text-white">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-treasure-gold">訊息通知</h1>
          {unreadCount > 0 && (
            <span className="px-3 py-1 bg-[#fbbf24] text-[#1b0e07] rounded-full text-sm font-semibold">
              {unreadCount} 則未讀
            </span>
          )}
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="gothic-button p-8 rounded-lg text-center">
              <p className="text-soul-glow/70">目前沒有通知</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`gothic-button p-4 rounded-lg border transition-colors ${
                  !notification.isRead
                    ? 'border-[#fbbf24]/70 bg-[#fbbf24]/10'
                    : 'border-[#f0d9b5]/30 bg-[#2b1a10]/70'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-[#f7e7c7]">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-[#fbbf24] rounded-full"></span>
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-sm text-[#f0d9b5]/80 mb-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-soul-glow/50">
                      {formatTime(notification.Create_time)}
                    </p>
                  </div>

                  {/* 好友請求操作按鈕 */}
                  {notification.type === 'friend_request' && !notification.isRead && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptFriend(notification)}
                        className="px-4 py-2 bg-[#fbbf24] text-[#1b0e07] rounded-lg text-sm font-semibold hover:bg-[#f59e0b] transition-colors whitespace-nowrap"
                      >
                        接受
                      </button>
                      <button
                        onClick={() => handleRejectFriend(notification)}
                        className="px-4 py-2 border border-[#fbbf24]/50 text-[#fbbf24] rounded-lg text-sm font-semibold hover:border-[#fbbf24] hover:bg-[#fbbf24]/10 transition-colors whitespace-nowrap"
                      >
                        拒絕
                      </button>
                    </div>
                  )}

                  {/* 其他通知類型可以點擊標記為已讀 */}
                  {notification.type !== 'friend_request' && !notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="px-3 py-1 text-xs text-soul-glow/70 hover:text-soul-glow border border-soul-glow/30 rounded hover:border-soul-glow/50 transition-colors"
                    >
                      標記已讀
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


