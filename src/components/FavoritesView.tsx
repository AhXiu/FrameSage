import type { Favorite } from '@/types';
import { Bookmark, Camera, RotateCcw, Trash2 } from 'lucide-react';

export function FavoritesView({
  items,
  onUpdate,
  onDelete,
  onApply,
}: {
  items: Favorite[];
  onUpdate: (id: string, note: string) => void;
  onDelete: (id: string) => void;
  onApply: (f: Favorite) => void;
}) {
  return (
    <div className="library-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">YOUR CONTACT SHEET</span>
          <h1>收藏方案</h1>
          <p>每一次收藏都是完整快照，设备、参数与姿势不会随之后的设置改变。</p>
        </div>
      </header>
      {items.length === 0 ? (
        <div className="empty-state">
          <Bookmark />
          <h2>还没有收藏</h2>
          <p>完成一次扫描，在成套方案页收藏你想复拍的组合。</p>
        </div>
      ) : (
        <div className="favorite-list">
          {items.map(f => (
            <article className="favorite-card" key={f.id}>
              <div className="favorite-cover">
                <Camera />
                <span>{f.scene.name}</span>
                <b>
                  {f.params.aperture} · {f.params.shutter}
                </b>
              </div>
              <div className="favorite-body">
                <div className="favorite-title">
                  <div>
                    <small>
                      {new Date(f.createdAt).toLocaleDateString('zh-CN')} ·{' '}
                      {f.device.brand}
                    </small>
                    <h2>{f.plan.name}</h2>
                  </div>
                  <button onClick={() => onDelete(f.id)} aria-label="删除收藏">
                    <Trash2 />
                  </button>
                </div>
                <div className="mini-params">
                  <span>ISO {f.params.iso}</span>
                  <span>{f.params.whiteBalance}</span>
                  <span>{f.plan.composition}</span>
                  <span>{f.plan.focal}mm</span>
                </div>
                <label>
                  拍摄备注
                  <textarea
                    placeholder="记录地点、模特或下次调整…"
                    value={f.note}
                    onChange={e => onUpdate(f.id, e.target.value)}
                  />
                </label>
                <button className="secondary wide" onClick={() => onApply(f)}>
                  <RotateCcw size={17} /> 再次应用
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
