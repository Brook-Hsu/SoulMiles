import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// 只有在 DATABASE_URL 存在時才初始化 PrismaClient
// 如果沒有 DATABASE_URL，創建一個假的 client 以避免初始化錯誤
let prismaInstance: PrismaClient;

if (process.env.DATABASE_URL) {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
} else {
  // 創建一個假的 PrismaClient 實例以避免模組載入錯誤
  // 實際使用時會拋出錯誤，但不會阻止應用啟動
  prismaInstance = {} as PrismaClient;
}

export const prisma = prismaInstance;
