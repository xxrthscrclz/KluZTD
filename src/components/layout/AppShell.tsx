import { lazy, Suspense, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { useUrgentCount } from '@/components/daily/UrgentPanel';
import BrandMark from '@/components/layout/BrandMark';
import ScratchPanel from '@/components/layout/ScratchPanel';
import SyncBadge from '@/components/layout/SyncBadge';
import ThemeSwitch, { ThemeToggle } from '@/components/layout/ThemeSwitch';
import Toaster from '@/components/ui/Toaster';
import { NAV } from '@/constants/nav';
import { useHotkeys } from '@/hooks/useHotkey';
import { useLatest, usePresence } from '@/hooks/usePresence';
import { useUiStore } from '@/stores/uiStore';

const TaskDrawer = lazy(() => import('@/components/task/TaskDrawer'));
const FloatingToolbar = lazy(() => import('@/components/editor/FloatingToolbar'));
const MathPopover = lazy(() => import('@/components/editor/MathPopover'));

/** 에디터가 보이는 동안(일일 관리, 상세 패널, 펼친 자유공간)만 서식 막대를 띄운다 */
function EditorChrome() {
  const location = useLocation();
  const [params] = useSearchParams();
  const scratchOpen = useUiStore((s) => s.scratchOpen);
  const visible = location.pathname.startsWith('/daily') || location.pathname.startsWith('/notebook') || Boolean(params.get('t')) || scratchOpen;
  if (!visible) return null;
  return (
    <Suspense fallback={null}>
      <FloatingToolbar visible />
      <MathPopover />
    </Suspense>
  );
}

/** 상세 패널은 ?t= 가 있을 때만 받아서 띄운다 — 닫힐 땐 미끄러져 나가는 동안 남겨 둔다 */
function DrawerSlot() {
  const [params] = useSearchParams();
  const taskId = params.get('t');
  const { mounted, leaving } = usePresence(Boolean(taskId));
  const lastId = useLatest(taskId);
  if (!mounted || !lastId) return null;
  return (
    <Suspense fallback={null}>
      <TaskDrawer taskId={lastId} issueId={params.get('i')} leaving={leaving} />
    </Suspense>
  );
}

function Sidebar() {
  const urgent = useUrgentCount();
  return (
    <div role="complementary" aria-label="사이드바" className="sticky top-0 hidden h-dvh w-[15rem] flex-none flex-col border-r border-border-default bg-bg-sunken/60 px-3 pt-5 pb-4 sm:flex lg:w-[15.5rem]">
      <div className="px-2 pb-6">
        <BrandMark />
      </div>
      <div role="navigation" className="flex flex-col gap-0.5" aria-label="주 메뉴">
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group flex h-10 items-center gap-3 rounded-[10px] px-2.5 text-sm font-semibold transition-colors ${
                isActive ? 'bg-bg-surface text-text-primary shadow-card' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`
            }
          >
            <item.icon className="size-[18px] flex-none" strokeWidth={2} />
            <div className="flex-1">{item.label}</div>
            {item.path === '/daily' && urgent ? (
              <div
                className="grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[0.68rem] font-bold text-white tabular-nums"
                title="마감 임박인데 체크리스트에 없는 할 일"
                data-testid="urgent-badge"
              >
                {urgent}
              </div>
            ) : (
              <div className="hidden font-mono text-[0.68rem] text-text-muted group-hover:block">{item.key}</div>
            )}
          </NavLink>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3 px-1">
        <div className="rounded-xl border border-dashed border-border-strong px-3 py-2.5 text-[0.72rem] leading-relaxed text-text-muted">
          <div className="font-semibold text-text-secondary">단축키</div>
          <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
            <div className="font-mono">N</div>
            <div>할 일 추가</div>
            <div className="font-mono">1–5</div>
            <div>화면 이동</div>
            <div className="font-mono">M</div>
            <div>자유공간</div>
            <div className="font-mono">/</div>
            <div>검색</div>
          </div>
        </div>
        <SyncBadge />
        <ThemeSwitch />
      </div>
    </div>
  );
}

function MobileTopBar() {
  const location = useLocation();
  const current = NAV.find((n) => location.pathname.startsWith(n.path));
  return (
    <div role="banner" className="pt-safe sticky top-0 z-30 flex flex-none items-center justify-between gap-3 border-b border-border-default bg-bg-page/90 px-4 backdrop-blur-xl sm:hidden">
      <div className="flex h-12 items-center gap-2.5">
        <BrandMark size={24} withName={false} />
        <div className="text-base font-bold">{current?.label ?? (location.pathname.startsWith('/archive') ? '아카이브' : 'KluZTD')}</div>
      </div>
      <div className="flex items-center gap-3">
        <SyncBadge compact />
        <ThemeToggle />
      </div>
    </div>
  );
}

function BottomNav() {
  const urgent = useUrgentCount();
  return (
    <div
      role="navigation"
      aria-label="하단 메뉴"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border-default bg-bg-surface/92 backdrop-blur-xl sm:hidden"
    >
      <div className="grid h-[3.75rem] grid-cols-5">
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 text-[0.68rem] font-semibold transition-colors ${
                isActive ? 'text-text-primary' : 'text-text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${isActive ? 'bg-bg-active' : ''}`}>
                  <item.icon className="size-[19px]" strokeWidth={isActive ? 2.3 : 1.9} />
                </div>
                {item.label}
                {item.path === '/daily' && urgent ? (
                  <div className="absolute top-1.5 left-[calc(50%+6px)] grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[0.6rem] font-bold text-white tabular-nums">
                    {urgent}
                  </div>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const scratchOpen = useUiStore((s) => s.scratchOpen);
  useHotkeys({
    n: (e) => {
      e.preventDefault();
      navigate('/daily', { state: { focus: true } });
    },
    ...Object.fromEntries(NAV.map((item) => [item.key, () => navigate(item.path)])),
  });

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      {/* 넓은 화면에선 자유공간을 펼치면 내용이 옆으로 비켜서 둘 다 보인다 */}
      <div className={`flex min-w-0 flex-1 flex-col transition-[padding] ${scratchOpen ? 'lg:pr-[27rem]' : ''}`}>
        <MobileTopBar />
        <div role="main" className="flex min-w-0 flex-1 flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom))] sm:pb-0">{children}</div>
      </div>
      <BottomNav />
      <DrawerSlot />
      <ScratchPanel />
      <EditorChrome />
      <Toaster />
    </div>
  );
}
