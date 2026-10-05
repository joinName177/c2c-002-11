import type { GardenRepository } from '../ports/garden-repository.port';
import type { GardenSnapshot } from '../core/models';
import { sampleSnapshot, syncPlants } from '../core/garden-engine';
const KEY = 'c2c-002-emotion-garden';
export class LocalGardenRepository implements GardenRepository {
  load(): GardenSnapshot {
    let snapshot: GardenSnapshot | null = null;
    try { const value = localStorage.getItem(KEY); if (value) snapshot = JSON.parse(value) as GardenSnapshot; } catch { snapshot = null; }
    if (!snapshot) return sampleSnapshot();
    // 旧版本把“记录次数”（entryIds.length）当作生长天数，同一天多次记录会被重复计算。
    // 下次刷新时按真实记录的去重日期统一重算，并立即写回，避免继续沿用错误数据。
    const entries = snapshot.entries ?? [];
    const plants = syncPlants(entries, snapshot.plants ?? []);
    const normalized: GardenSnapshot = { entries, plants };
    if (JSON.stringify(normalized) !== JSON.stringify(snapshot)) {
      try { localStorage.setItem(KEY, JSON.stringify(normalized)); } catch { /* 写入失败时仍以本次内存重算结果为准 */ }
    }
    return normalized;
  }
  save(snapshot: GardenSnapshot) { localStorage.setItem(KEY, JSON.stringify(snapshot)); }
}
