import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Connect, Plugin } from 'vite';

/** 프로젝트 루트 기준 고정 저장 경로 */
export const KLUZTD_DATA_RELATIVE = 'data/kluztd.json';

const EMPTY = {
  version: 1 as const,
  items: [] as unknown[],
  projects: [] as unknown[],
  activeListId: null as string | null,
};

function dataFilePath(root: string) {
  return path.resolve(root, KLUZTD_DATA_RELATIVE);
}

function ensureDataFile(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `${JSON.stringify(EMPTY, null, 2)}\n`, 'utf8');
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function attachApi(middlewares: Connect.Server, root: string) {
  const filePath = dataFilePath(root);
  ensureDataFile(filePath);

  middlewares.use('/api/kluztd', (req, res) => {
    void (async () => {
      const method = req.method ?? 'GET';
      try {
        if (method === 'GET') {
          ensureDataFile(filePath);
          const raw = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(raw) as typeof EMPTY;
          sendJson(res, 200, {
            filePath,
            relativePath: KLUZTD_DATA_RELATIVE,
            version: parsed.version ?? 1,
            items: parsed.items ?? [],
            projects: parsed.projects ?? [],
            activeListId: parsed.activeListId ?? null,
          });
          return;
        }

        if (method === 'PUT' || method === 'POST') {
          const body = await readBody(req);
          const parsed = JSON.parse(body) as {
            items?: unknown[];
            projects?: unknown[];
            activeListId?: string | null;
          };
          if (!Array.isArray(parsed.items)) {
            sendJson(res, 400, { error: 'items 배열이 필요합니다.' });
            return;
          }
          const payload = {
            version: 1 as const,
            items: parsed.items,
            projects: Array.isArray(parsed.projects) ? parsed.projects : [],
            activeListId: parsed.activeListId ?? null,
          };
          ensureDataFile(filePath);
          fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
          sendJson(res, 200, {
            ok: true,
            filePath,
            relativePath: KLUZTD_DATA_RELATIVE,
          });
          return;
        }

        sendJson(res, 405, { error: 'Method Not Allowed' });
      } catch (err) {
        sendJson(res, 500, {
          error: err instanceof Error ? err.message : 'data api error',
        });
      }
    })();
  });
}

/**
 * 로컬 전용: `data/kluztd.json` ↔ GET/PUT `/api/kluztd`
 * `pnpm dev` / `pnpm preview`(KluZTD.command) 에서 동작
 */
export function kluztdDataPlugin(): Plugin {
  return {
    name: 'kluztd-data-file',
    configureServer(server) {
      const filePath = dataFilePath(server.config.root);
      // 저장마다 Vite watcher가 페이지를 리로드하지 않도록
      server.watcher.unwatch(filePath);
      server.watcher.unwatch(path.dirname(filePath));
      attachApi(server.middlewares, server.config.root);
    },
    configurePreviewServer(server) {
      attachApi(server.middlewares, server.config.root);
    },
  };
}
