const REPO = 'pbwebsite/Website';

export default {
  async fetch(req, env) {
    if (new URL(req.url).pathname === '/api' && req.method === 'POST') {
      return handle(req, env);
    }
    return env.ASSETS.fetch(req);
  }
};

async function handle(req, env) {
  const body = await req.json().catch(() => null);
  if (!body || body.password !== env.ADMIN_PASSWORD) {
    return r({ error: 'Unauthorized' }, 401);
  }

  const gh = (path, method = 'GET', data) => fetch(
    `https://api.github.com/repos/${REPO}${path}`,
    {
      method,
      headers: {
        Authorization: `token ${env.GITHUB_PAT}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'pbwebsite',
      },
      body: data ? JSON.stringify(data) : undefined,
    }
  );

  if (body.action === 'publish') {
    // Create the 'article' label if it doesn't exist yet
    const check = await gh('/labels/article');
    if (check.status === 404) {
      await gh('/labels', 'POST', { name: 'article', color: '3a8fa2', description: 'Published article' });
    }
    const res = await gh('/issues', 'POST', { title: body.title, body: body.content, labels: ['article'] });
    return r(await res.json(), res.status);
  }

  if (body.action === 'upload') {
    const name = body.filename.replace(/[^a-z0-9.]/gi, '-').toLowerCase();
    const res = await gh(`/contents/images/articles/${Date.now()}-${name}`, 'PUT', {
      message: `Upload: ${body.filename}`,
      content: body.content,
    });
    return r(await res.json(), res.status);
  }

  // No action = password check only
  return r({ ok: true });
}

const r = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
