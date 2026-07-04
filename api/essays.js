import { list, del } from '@vercel/blob';

// There's no separate database here — each PDF's pathname encodes its own
// id and title:  essays/<id>__<url-encoded-title>.pdf
// so the essay "index" is just whatever Vercel Blob's list() returns.

function parseEssayBlob(blob) {
  const filename = blob.pathname.split('/').pop() || '';
  const withoutExt = filename.replace(/\.pdf$/i, '');
  const sepIndex = withoutExt.indexOf('__');
  const id = sepIndex === -1 ? withoutExt : withoutExt.slice(0, sepIndex);
  const encodedTitle = sepIndex === -1 ? '' : withoutExt.slice(sepIndex + 2);

  let title = filename;
  try {
    title = encodedTitle ? decodeURIComponent(encodedTitle) : filename;
  } catch {
    title = encodedTitle || filename;
  }

  return {
    id,
    title,
    url: blob.url,
    pathname: blob.pathname,
    uploadedAt: blob.uploadedAt,
    size: blob.size,
  };
}

export default async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: 'essays/' });
      const essays = blobs
        .filter((b) => b.pathname.toLowerCase().endsWith('.pdf'))
        .map(parseEssayBlob)
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      return response.status(200).json(essays);
    } catch (error) {
      console.error('List essays error:', error);
      return response.status(500).json({ error: error.message });
    }
  }

  if (request.method === 'DELETE') {
    const { id } = request.query;
    if (!id) {
      return response.status(400).json({ error: 'Missing id' });
    }

    try {
      const { blobs } = await list({ prefix: `essays/${id}__` });
      // Fallback for a pathname with no title separator at all.
      const matches = blobs.length ? blobs : (await list({ prefix: `essays/${id}.pdf` })).blobs;

      if (!matches.length) {
        return response.status(404).json({ error: 'Essay not found' });
      }

      await del(matches.map((b) => b.url));
      return response.status(200).json({ ok: true });
    } catch (error) {
      console.error('Delete essay error:', error);
      return response.status(500).json({ error: error.message });
    }
  }

  response.setHeader('Allow', 'GET, DELETE');
  return response.status(405).json({ error: 'Method not allowed' });
}
