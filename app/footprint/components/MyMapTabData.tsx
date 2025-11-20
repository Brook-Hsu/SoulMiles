import { prisma } from '../../../lib/prisma';
import { auth } from '../../../lib/auth';
import MyMapTabClient from './MyMapTabClient';

/**
 * MyMapTabData - Server Component
 * 在服務器端獲取 MapRecord 數據並傳遞給 Client Component
 */
export default async function MyMapTabData() {
  let userId: string | null = null;

  try {
    // 獲取當前用戶的 session
    const session = await auth();
    
    // 檢查用戶是否已登入
    if (session && session.user && (session.user as any).id) {
      userId = (session.user as any).id;
    }
  } catch (error) {
    // 如果 auth 初始化失敗（例如 OAuth 憑證未配置），記錄錯誤但不阻止頁面渲染
    console.error('[MyMapTabData] 獲取 session 失敗:', error);
    // 返回空記錄列表，讓頁面可以正常顯示
    return <MyMapTabClient records={[]} />;
  }

  // 如果沒有有效的 user_id，返回空記錄列表
  if (!userId) {
    return <MyMapTabClient records={[]} />;
  }

  let records = [];

  try {
    const mapRecords = await prisma.mapRecord.findMany({
      where: {
        user_id: userId,
      },
      include: {
        pictures: true,
      },
      orderBy: {
        Create_time: 'desc',
      },
    });

    // 轉換日期為字符串以便序列化
    records = mapRecords.map((record) => ({
      id: record.id,
      name: record.name,
      description: record.description,
      coordinate: record.coordinate,
      Create_time: record.Create_time.toISOString(),
      pictures: record.pictures.map((pic) => ({
        id: pic.id,
        picture: pic.picture,
      })),
    }));
  } catch (error) {
    console.error('獲取 MapRecord 失敗:', error);
  }

  return <MyMapTabClient records={records} />;
}

