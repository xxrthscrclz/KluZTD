import path from 'node:path';
import type { Connect, Plugin } from 'vite';

import { createDataApi, resolveFile } from './server/dataApi';

export { KLUZTD_DATA_RELATIVE } from './server/dataApi';

function attachApi(middlewares: Connect.Server, root: string) {
  const handle = createDataApi(resolveFile(root));
  middlewares.use('/api/kluztd', (req, res) => handle(req, res, req.url ?? '/'));
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
