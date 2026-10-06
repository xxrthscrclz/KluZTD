import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Connect, Plugin } from 'vite';

/**
 * 로컬 전용 데이터 API — `data/kluztd.json` 파일 하나에 전부 저장한다.
 *
 *   GET  /api/kluztd          → { rev, savedAt, ...데이터(tasks, days, scratch …) }
 *   PUT  /api/kluztd          ← { baseRev, ...데이터 }  — 데이터 필드는 구조를 몰라도 그대로 저장한다
 *                               baseRev 가 파일의 rev 와 다르면 409 + 현재 파일 (클라이언트가 병합 후 재시도)
 *   GET  /api/kluztd/events   → SSE. 저장될 때마다 { rev, clientId } 를 흘려보낸다 (다른 탭/기기 실시간 반영)
 *
 * 저장 경로는 KLUZTD_DATA_FILE 로 바꿀 수 있다 (e2e 테스트가 실제 데이터를 건드리지 않도록).
 */

export const KLUZTD_DATA_RELATIVE = 'data/kluztd.json';
const BACKUP_KEEP = 14;
const MAX_BODY = 20 * 1024 * 1024;

type FileData = {
  version: 2;
  rev: number;
  savedAt: string | null;
  tasks: unknown[];
  [field: string]: unknown;
};

const empty = (): FileData => ({ version: 2, rev: 0, savedAt: null, tasks: [] });

function resolveFile(root: string) {
  const fromEnv = process.env.KLUZTD_DATA_FILE;
  return fromEnv ? path.resolve(fromEnv) : path.resolve(root, KLUZTD_DATA_RELATIVE);
}

function readFile(file: string): FileData {
  if (!fs.existsSync(file)) return empty();
  const raw = fs.readFileSync(file, 'utf8').trim();
  if (!raw) return empty();
  const parsed = JSON.parse(raw) as Partial<FileData>;
  // v1(이전 버전) 파일은 구조가 달라 새로 시작한다 — 원본은 백업으로 남긴다
  if (parsed.version !== 2) {
    const legacy = `${file}.v${parsed.version ?? 'x'}.bak`;
    if (!fs.existsSync(legacy)) fs.copyFileSync(file, legacy);
    return empty();
  }
  return {
    ...empty(),
    ...parsed,
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
  } as FileData;
}

/** 임시 파일에 쓰고 rename — 저장 도중 꺼져도 파일이 반쯤 깨지지 않는다 */
function writeAtomic(file: string, data: FileData) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, file);
}

/** 하루 한 번 data/backups/kluztd-YYYY-MM-DD.json 으로 남기고 최근 14개만 유지 */
function dailyBackup(file: string) {
  if (!fs.existsSync(file)) return;
  const dir = path.join(path.dirname(file), 'backups');
  const d = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const target = path.join(dir, `${path.basename(file, '.json')}-${key}.json`);
  if (fs.existsSync(target)) return;
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(file, target);
  const old = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(BACKUP_KEEP);
  for (const f of old) fs.rmSync(path.join(dir, f));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('요청이 너무 큽니다'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function publicView(data: FileData) {
  const { version: _version, ...rest } = data;
  return rest;
}

function attachApi(middlewares: Connect.Server, root: string) {
  const file = resolveFile(root);
  const listeners = new Set<ServerResponse>();

  const broadcast = (payload: { rev: number; clientId: string | null }) => {
    const line = `event: rev\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of listeners) res.write(line);
  };

  // 프록시·브라우저가 오래 쉬는 연결을 끊지 않도록
  const ping = setInterval(() => {
    for (const res of listeners) res.write(': ping\n\n');
  }, 25_000);
  ping.unref();

  middlewares.use('/api/kluztd', (req, res) => {
    void (async () => {
      const url = req.url ?? '/';
      const method = req.method ?? 'GET';
      try {
        if (url.startsWith('/events')) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-store',
            Connection: 'keep-alive',
          });
          res.write(`event: rev\ndata: ${JSON.stringify({ rev: readFile(file).rev, clientId: null })}\n\n`);
          listeners.add(res);
          req.on('close', () => listeners.delete(res));
          return;
        }

        if (method === 'GET') {
          sendJson(res, 200, publicView(readFile(file)));
          return;
        }

        if (method === 'PUT') {
          const body = JSON.parse(await readBody(req)) as { baseRev?: number; tasks?: unknown[]; [field: string]: unknown };
          if (!Array.isArray(body.tasks)) {
            sendJson(res, 400, { error: 'tasks 배열이 필요합니다.' });
            return;
          }
          const current = readFile(file);
          if (body.baseRev !== current.rev) {
            sendJson(res, 409, publicView(current));
            return;
          }
          const { baseRev: _baseRev, rev: _rev, savedAt: _savedAt, version: _v, ...fields } = body;
          const next: FileData = {
            ...fields,
            version: 2,
            rev: current.rev + 1,
            savedAt: new Date().toISOString(),
            tasks: body.tasks,
          };
          dailyBackup(file);
          writeAtomic(file, next);
          const clientId = req.headers['x-kluztd-client'];
          broadcast({ rev: next.rev, clientId: typeof clientId === 'string' ? clientId : null });
          sendJson(res, 200, { rev: next.rev, savedAt: next.savedAt });
          return;
        }

        sendJson(res, 405, { error: 'Method Not Allowed' });
      } catch (err) {
        sendJson(res, 500, { error: err instanceof Error ? err.message : 'data api error' });
      }
    })();
  });
}

export function kluztdDataPlugin(): Plugin {
  return {
    name: 'kluztd-data-file',
    configureServer(server) {
      const file = resolveFile(server.config.root);
      // 저장할 때마다 Vite 가 페이지를 새로고침하지 않도록
      server.watcher.unwatch(path.dirname(file));
      attachApi(server.middlewares, server.config.root);
    },
    configurePreviewServer(server) {
      attachApi(server.middlewares, server.config.root);
    },
  };
}
