import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import AppRouter from '@/routes/routes';
import { useGtdStore } from '@/stores/gtdStore';
import { useThemeStore } from '@/stores/themeStore';

import './index.css';

useThemeStore.getState();

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <div className="flex min-h-screen items-center justify-center text-sm font-medium text-text-secondary">
      데이터 불러오는 중… (data/kluztd.json)
    </div>
  </StrictMode>,
);

void useGtdStore
  .getState()
  .hydrate()
  .finally(() => {
    root.render(
      <StrictMode>
        <AppRouter />
      </StrictMode>,
    );
  });
