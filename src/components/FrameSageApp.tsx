import { useFrameSage } from '@/hooks/useFrameSage';
import { matchesFavorite } from '@/lib/favorites';
import type { TabId } from '@/types';
import { Bookmark, Camera, Layers3, Settings2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { DeviceManager } from './DeviceManager';
import { FavoritesView } from './FavoritesView';
import { PlanView } from './PlanView';
import { Scanner } from './Scanner';
import { SettingsView } from './SettingsView';

export function FrameSageApp() {
  const app = useFrameSage();
  const [tab, setTab] = useState<TabId>('shoot');
  const [activePlan, setActivePlan] = useState(0);
  const [toast, setToast] = useState('');
  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 1800);
  };
  const activePlanItem = app.plans[activePlan] ?? app.plans[0];
  const favoriteItem = app.favorites.find(item =>
    matchesFavorite(item, activePlanItem?.id, app.scene.id, app.device.id),
  );
  const favorite = () => {
    if (favoriteItem) {
      app.removeFavorite(favoriteItem.id);
      notify('已取消收藏');
      return;
    }
    app.addFavorite(activePlan);
    notify('方案已完整收藏');
  };
  return (
    <div className="app-shell">
      <aside className="desktop-brand">
        <div className="brand-mark">
          <Camera />
        </div>
        <h1>FrameSage</h1>
        <p>人像现场的光影顾问</p>
        <div className="brand-quote">
          “不是替你按快门，
          <br />
          而是让每一次按下更有把握。”
        </div>
        <small>LOCAL-FIRST · PORTRAIT ASSISTANT</small>
      </aside>
      <main className="phone-app">
        <header className="topbar">
          <button className="brand" onClick={() => setTab('shoot')}>
            <span>
              <Sparkles />
            </span>
            <b>FrameSage</b>
          </button>
          {tab === 'shoot' && (
            <span className="mode-badge">
              {app.mode === 'beginner' ? '新手引导' : '发烧友模式'}
            </span>
          )}
        </header>
        <div className="content">
          {tab === 'shoot' && (
            <div className="shoot-page">
              <DeviceManager
                devices={app.devices}
                current={app.device}
                onSave={app.saveDevice}
                onDelete={app.deleteDevice}
                onSelect={app.selectDevice}
                forced={app.devices.length === 0}
              />
              <Scanner
                assessment={app.assessment}
                onResult={assessment => {
                  app.setAssessment(assessment);
                  setActivePlan(0);
                  notify(`已识别：${assessment.primary.name}`);
                }}
              />
              <button className="next-plan" onClick={() => setTab('plan')}>
                <span>
                  <small>场景就绪</small>
                  <strong>查看成套拍摄方案</strong>
                </span>
                <Layers3 />
              </button>
            </div>
          )}
          {tab === 'plan' && (
            <PlanView
              scene={app.scene}
              params={app.params}
              plans={app.plans}
              active={activePlan}
              setActive={setActivePlan}
              mode={app.mode}
              device={app.device}
              context={app.shootingContext}
              onContextChange={app.setShootingContext}
              isFavorited={Boolean(favoriteItem)}
              onFavorite={favorite}
            />
          )}
          {tab === 'favorites' && (
            <FavoritesView
              items={app.favorites}
              onUpdate={app.updateFavorite}
              onDelete={id => {
                app.removeFavorite(id);
                notify('收藏已删除');
              }}
              onApply={f => {
                app.applyFavorite(f);
                setTab('plan');
                notify('已恢复收藏快照');
              }}
            />
          )}
          {tab === 'settings' && (
            <SettingsView
              mode={app.mode}
              setMode={app.setMode}
              devices={app.devices}
              current={app.device}
              onSave={app.saveDevice}
              onDelete={app.deleteDevice}
              onSelect={app.selectDevice}
              onClear={() => {
                app.clear();
                setTab('shoot');
                notify('本地数据已清空');
              }}
            />
          )}
        </div>
        <nav className="bottom-nav" aria-label="主要导航">
          <Nav
            id="shoot"
            tab={tab}
            set={setTab}
            icon={<Camera />}
            label="拍摄"
          />
          <Nav
            id="plan"
            tab={tab}
            set={setTab}
            icon={<Layers3 />}
            label="方案"
          />
          <Nav
            id="favorites"
            tab={tab}
            set={setTab}
            icon={<Bookmark />}
            label="收藏"
          />
          <Nav
            id="settings"
            tab={tab}
            set={setTab}
            icon={<Settings2 />}
            label="设置"
          />
        </nav>
        {toast && <div className="toast-note">{toast}</div>}
      </main>
    </div>
  );
}
function Nav({
  id,
  tab,
  set,
  icon,
  label,
}: {
  id: TabId;
  tab: TabId;
  set: (t: TabId) => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className={tab === id ? 'active' : ''}
      onClick={() => set(id)}
      aria-pressed={tab === id}
      aria-label={`${label}页`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
