'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';

export default function MemberCenterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [userName, setUserName] = useState('');
  const [friends, setFriends] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 如果未登入，導向首頁
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // 載入使用者資料和好友列表
  useEffect(() => {
    if (session?.user?.email) {
      loadUserData();
      loadFriends();
    }
  }, [session]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setUserName(data.name || data.UserName || '');
      }
    } catch (error) {
      console.error('載入使用者資料失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('載入好友列表失敗:', error);
    }
  };

  const handleSave = async () => {
    if (!userName.trim()) {
      alert('使用者名稱不能為空');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: userName }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        alert('儲存成功！');
      } else {
        const error = await response.json();
        alert(error.error || '儲存失敗');
      }
    } catch (error) {
      console.error('儲存失敗:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/user/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('搜尋失敗:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (friendId) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId }),
      });

      if (response.ok) {
        alert('好友請求已發送！');
        setShowAddFriend(false);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        const error = await response.json();
        alert(error.error || '發送好友請求失敗');
      }
    } catch (error) {
      console.error('發送好友請求失敗:', error);
      alert('發送好友請求失敗，請稍後再試');
    }
  };

  // 取得 ID 後五碼
  const getLastFiveDigits = (id) => {
    if (!id) return '';
    return id.slice(-5);
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
        <h1 className="text-3xl font-bold mb-6 text-treasure-gold">會員中心</h1>

        {/* 使用者資訊區塊 */}
        <div className="gothic-button p-6 rounded-lg mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="使用者名稱"
                  className="flex-1 px-4 py-2 bg-[#1a1410]/80 border border-[#fbbf24]/30 rounded-lg text-white placeholder:text-[#f7e7c7]/50 focus:outline-none focus:border-[#fbbf24]"
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-[#fbbf24] text-[#1b0e07] rounded-lg font-semibold hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? '儲存中...' : '儲存'}
                </button>
              </div>
              {userData && (
                <>
                  <p className="text-sm text-soul-glow/70 mb-2">
                    ID: {getLastFiveDigits(userData.id)}
                  </p>
                  <p className="text-sm text-soul-glow/70">
                    天堂幣: <span className="text-treasure-gold font-semibold">{userData.coin || 0}</span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 好友列表區塊 */}
        <div className="gothic-button p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-treasure-gold">好友列表</h2>
            <button
              onClick={() => setShowAddFriend(!showAddFriend)}
              className="px-4 py-2 bg-[#fbbf24]/20 border border-[#fbbf24]/50 text-[#fbbf24] rounded-lg hover:bg-[#fbbf24]/30 transition-colors text-sm"
            >
              {showAddFriend ? '取消' : '新增好友'}
            </button>
          </div>

          {/* 搜尋好友區域 */}
          {showAddFriend && (
            <div className="mb-4 p-4 bg-[#1a1410]/50 rounded-lg border border-[#fbbf24]/20">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) {
                      handleSearch();
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder="搜尋使用者名稱或 ID 後五碼"
                  className="flex-1 px-4 py-2 bg-[#1a1410]/80 border border-[#fbbf24]/30 rounded-lg text-white placeholder:text-[#f7e7c7]/50 focus:outline-none focus:border-[#fbbf24]"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-4 py-2 bg-[#fbbf24] text-[#1b0e07] rounded-lg font-semibold hover:bg-[#f59e0b] transition-colors disabled:opacity-50"
                >
                  {isSearching ? '搜尋中...' : '搜尋'}
                </button>
              </div>

              {/* 搜尋結果 */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-[#2b1a10]/70 rounded-lg border border-[#fbbf24]/20"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#fbbf24]">{user.name || user.UserName || '未命名'}</p>
                        <p className="text-xs text-soul-glow/60">ID: {getLastFiveDigits(user.id)}</p>
                      </div>
                      <button
                        onClick={() => handleAddFriend(user.id)}
                        className="px-3 py-1 bg-[#fbbf24] text-[#1b0e07] rounded text-sm font-semibold hover:bg-[#f59e0b] transition-colors"
                      >
                        新增
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && !isSearching && (
                <p className="text-sm text-soul-glow/50 text-center py-2">找不到符合的使用者</p>
              )}
            </div>
          )}

          {/* 好友列表 */}
          <div className="space-y-2">
            {friends.length > 0 ? (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 bg-[#2b1a10]/70 rounded-lg border border-[#fbbf24]/20"
                >
                  {friend.friendUser?.image && (
                    <img
                      src={friend.friendUser.image}
                      alt={friend.friendUser.name || 'Friend'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#fbbf24]">
                      {friend.friendUser?.name || friend.friendUser?.UserName || '未命名'}
                    </p>
                    <p className="text-xs text-soul-glow/60">
                      ID: {getLastFiveDigits(friend.friendUser?.id)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-soul-glow/50 text-center py-4">目前沒有好友</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

