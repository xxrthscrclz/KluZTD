import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import 'katex/dist/katex.min.css';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import { installArrowInput } from '@/lib/arrows';
import { installPressFeedback } from '@/lib/motion';
import { startSync } from '@/lib/sync';
import AppRouter from '@/routes/routes';
import { useThemeStore } from '@/stores/themeStore';

// 테마 먼저 (깜빡임 방지)
useThemeStore.getState();

// 데스크톱 앱(Electron)은 앱 파일이 곧 최신이라 오프라인 캐시가 필요 없다 — 켜 두면 업데이트 직후 옛 화면이 뜬다
if (!navigator.userAgent.includes('Electron')) registerSW({ immediate: true });
installPressFeedback();
installArrowInput();

const root = createRoot(document.getElementById('root')!);

const render = () =>
  root.render(
    <StrictMode>
      <AppRouter />
    </StrictMode>,
  );

// 캐시는 바로, 서버는 잠깐만 기다린다 — 서버가 느려도 화면은 뜬다
void Promise.race([startSync(), new Promise((r) => setTimeout(r, 1200))]).finally(render);
