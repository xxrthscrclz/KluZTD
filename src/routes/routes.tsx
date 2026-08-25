import { HashRouter, Route, Routes } from 'react-router-dom';

import HomePage from '@/pages/home';

/** HashRouter: 로컬에서 dist/index.html 을 파일로 열어도 라우팅이 동작합니다. */
export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </HashRouter>
  );
}
