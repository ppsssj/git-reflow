import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 8787);

let latestTemplate = {
  id: 'github-dashboard-reference',
  provider: 'github',
  columnLayout: {
    left: 320,
    main: 900,
    right: 315,
  },
  leftSidebarResizeEnabled: true,
  selectedVariationId: 'github-default',
  updatedAt: new Date().toISOString(),
};

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body, null, 2));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
    });

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/templates/github-home/latest') {
    sendJson(response, 200, latestTemplate);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/templates/github-home') {
    try {
      const template = await readJson(request);

      latestTemplate = {
        ...template,
        provider: 'github',
        updatedAt: new Date().toISOString(),
      };

      sendJson(response, 200, { ok: true, template: latestTemplate });
    } catch {
      sendJson(response, 400, { ok: false, error: 'Invalid JSON body' });
    }
    return;
  }

  sendJson(response, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`git-reflow backend listening on http://localhost:${PORT}`);
});
