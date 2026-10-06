import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import AppShell from '@/components/layout/AppShell';
import PageFallback from '@/components/layout/PageFallback';

// 에디터 코드가 커서 화면별로 필요할 때 받는다
const DailyPage = lazy(() => import('@/pages/daily'));
const StatusPage = lazy(() => import('@/pages/status'));
const CalendarPage = lazy(() => import('@/pages/calendar'));
const ProjectsPage = lazy(() => import('@/pages/projects'));

/** 화면이 바뀔 때마다 0.6초 ease 로 떠오르며 들어온다 (같은 화면 안의 날짜 이동은 따로 좌우로) */
function AnimatedRoutes() {
  const location = useLocation();
  const section = location.pathname.split('/')[1] ?? '';
  return (
    <div key={section} className="anim-page flex min-w-0 flex-1 flex-col">
      <Suspense fallback={<PageFallback />}>
        <Routes location={location}>
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/daily/:date" element={<DailyPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectsPage />} />
          {/* 예전 주소 */}
          <Route path="/today/*" element={<Navigate to="/daily" replace />} />
          <Route path="/board" element={<Navigate to="/status" replace />} />
          <Route path="*" element={<Navigate to="/daily" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

/** HashRouter — dist 를 정적 파일로 열어도, PWA 로 설치해도 경로가 깨지지 않는다 */
export default function AppRouter() {
  return (
    <HashRouter>
      <AppShell>
        <AnimatedRoutes />
      </AppShell>
    </HashRouter>
  );
}
