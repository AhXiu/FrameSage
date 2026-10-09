import type { Favorite } from '@/types';

/** 同姿势、同场景且同一设备才视为当前方案已收藏。 */
export function matchesFavorite(
  favorite: Favorite,
  planId: string | undefined,
  sceneId: Favorite['scene']['id'],
  deviceId: string,
): boolean {
  return (
    favorite.plan.id === planId &&
    favorite.scene.id === sceneId &&
    favorite.device.id === deviceId
  );
}
