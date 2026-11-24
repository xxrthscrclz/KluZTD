import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

import { app, BrowserWindow, dialog, Menu, session, shell } from 'electron';

import { createDataApi } from '../server/dataApi';

/**
 * 데스크톱 앱 — dist(웹 빌드)와 데이터 API 를 앱 안의 작은 로컬 서버로 띄우고 창에서 연다.
 *
 * - 포트를 고정하는 이유: 오리진(127.0.0.1:포트)이 바뀌면 localStorage 캐시·테마 설정이 매번 초기화된다.
 * - 데이터 파일: macOS ~/Library/Application Support/KluZTD/kluztd.json
 *              Windows %APPDATA%\KluZTD\kluztd.json   (KLUZTD_DATA_FILE 로 변경 가능)
 *   백업은 같은 폴더의 backups/ 에 하루 한 번.
 */

const PORT = Number(process.env.KLUZTD_APP_PORT) || 47321;
const HOST = '127.0.0.1';
const ORIGIN = `http://${HOST}:${PORT}`;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function dataFile() {
  return process.env.KLUZTD_DATA_FILE
    ? path.resolve(process.env.KLUZTD_DATA_FILE)
    : path.join(app.getPath('userData'), 'kluztd.json');
}

function startServer(distDir: string): Promise<http.Server> {
  const api = createDataApi(dataFile());
  const root = path.resolve(distDir);

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', ORIGIN);

    if (url.pathname === '/api/kluztd' || url.pathname.startsWith('/api/kluztd/')) {
      api(req, res, url.pathname.slice('/api/kluztd'.length) || '/');
      return;
    }

    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');

    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream',
      'Cache-Control': path.basename(file) === 'index.html' || file.endsWith('sw.js') ? 'no-cache' : 'max-age=31536000',
    });
    fs.createReadStream(file).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, HOST, () => resolve(server));
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 720,
    minHeight: 520,
    title: 'KluZTD',
    backgroundColor: '#f6f5f2',
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  // 앱 밖 링크는 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(ORIGIN)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(ORIGIN)) {
      e.preventDefault();
      void shell.openExternal(url);
    }
  });

  void win.loadURL(`${ORIGIN}/#/board`);
  return win;
}

function buildMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      // macOS 는 앱 이름 메뉴, Windows 는 '파일' 메뉴(닫기·끝내기)
      process.platform === 'darwin' ? { role: 'appMenu' } : { role: 'fileMenu' },
      { role: 'editMenu' },
      {
        label: '보기',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
      {
        label: '데이터',
        submenu: [
          { label: '데이터 폴더 열기', click: () => void shell.openPath(path.dirname(dataFile())) },
        ],
      },
      { role: 'windowMenu' },
    ]),
  );
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  void app.whenReady().then(async () => {
    const distDir = path.join(app.getAppPath(), 'dist');
    try {
      await startServer(distDir);
    } catch (err) {
      dialog.showErrorBox(
        'KluZTD',
        `로컬 서버를 열지 못했습니다 (포트 ${PORT}).\n다른 프로그램이 쓰고 있는지 확인하세요.\n\n${String(err)}`,
      );
      app.quit();
      return;
    }
    // 예전 빌드가 남긴 서비스워커·캐시를 지워 항상 지금 앱에 든 화면을 띄운다
    await session.defaultSession.clearStorageData({ origin: ORIGIN, storages: ['serviceworkers', 'cachestorage'] });
    buildMenu();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
