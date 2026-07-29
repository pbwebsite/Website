const REPO = 'pbwebsite/Website';
const LABEL = 'article';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, url.pathname);
    }
    return env.ASSETS.fetch(request);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

async function gh(env, endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `token ${env.GITHUB_PAT}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'pbwebsite-admin',
    }
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`https://api.github.com/repos/${REPO}${endpoint}`, opts);
}

async function handleAPI(request, env, path) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,X-Admin-Password', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' } });
  }

  const pw = request.headers.get('X-Admin-Password');
  if (!pw || pw !== env.ADMIN_PASSWORD) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (path === '/api/check' && request.method === 'GET') {
    return json({ ok: true });
  }

  if (path === '/api/publish' && request.method === 'POST') {
    const { title, body } = await request.json();
    if (!title || !body) return json({ error: 'title and body required' }, 400);
    const res = await gh(env, '/issues', 'POST', { title, body, labels: [LABEL] });
    const data = await res.json();
    return json(data, res.status);
  }

  if (path === '/api/upload-image' && request.method === 'POST') {
    const { content, filename } = await request.json();
    if (!content || !filename) return json({ error: 'content and filename required' }, 400);
    const safeName = filename.replace(/[^a-z0-9.]/gi, '-').toLowerCase();
    const filePath = `/contents/images/articles/${Date.now()}-${safeName}`;
    const res = await gh(env, filePath, 'PUT', {
      message: `Upload article image: ${filename}`,
      content
    });
    const data = await res.json();
    return json(data, res.status);
  }

  if (path === '/api/ensure-label' && request.method === 'POST') {
    const res = await gh(env, `/labels/${LABEL}`);
    if (res.status === 404) {
      await gh(env, '/labels', 'POST', { name: LABEL, color: '3a8fa2', description: 'Published article' });
    }
    return json({ ok: true });
  }

  return json({ error: 'Not found' }, 404);
}
