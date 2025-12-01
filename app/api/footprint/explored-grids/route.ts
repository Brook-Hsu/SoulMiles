import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserId } from '../../../../lib/middleware/auth';
import { coordinateToGridId } from '../../../../lib/utils/gridUtils';
import { successResponse, ApiErrors } from '../../../../lib/utils/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return successResponse({ grids: [] });
    }

    const footprints = await prisma.footprint.findMany({
      where: {
        user_id: userId,
        coordinate: { not: null },
      },
      select: {
        id: true,
        coordinate: true,
        Create_time: true,
      },
    });

    const gridMap = new Map<string, { coordinate: string; exploredAt: string }>();

    footprints.forEach((footprint) => {
      if (footprint.coordinate) {
        const [latStr, lonStr] = footprint.coordinate.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        if (!isNaN(lat) && !isNaN(lon)) {
          const gridId = coordinateToGridId(lat, lon);
          if (gridId) {
            const existing = gridMap.get(gridId);
            if (!existing || new Date(footprint.Create_time) > new Date(existing.exploredAt)) {
              gridMap.set(gridId, {
                coordinate: footprint.coordinate,
                exploredAt: footprint.Create_time.toISOString(),
              });
            }
          }
        }
      }
    });

    const grids = Array.from(gridMap.entries()).map(([gridId, data]) => ({
      gridId,
      coordinate: data.coordinate,
      exploredAt: data.exploredAt,
    }));

    return successResponse({ grids });
  } catch (error) {
    console.error('獲取已探索方塊失敗:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (
        errorMessage.includes('Environment variable') ||
        errorMessage.includes('DATABASE_URL') ||
        errorMessage.includes('Access denied') ||
        errorMessage.includes('Account is locked')
      ) {
        return successResponse({ grids: [] });
      }
    }
    
    return ApiErrors.INTERNAL_ERROR('獲取已探索方塊失敗');
  }
}

