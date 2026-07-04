import { put } from '@vercel/blob';

// A plain server-side upload: the browser POSTs the raw PDF bytes straight
// to this function, which writes them to Vercel Blob. Simpler and more
// reliable than the client-token handshake, at the cost of Vercel's
// per-function body size limit (4.5MB on Hobby). Fine for essay PDFs —
// if you need bigger files later, we can revisit client uploads.
//
// Note: Vercel only auto-parses req.body for application/json,
// application/x-www-form-urlencoded, and text/plain. Since the client
// sends application/pdf, req.body is left undefined and we have to read
// the raw request stream ourselves.

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { id, title } = request.query;
  if (!id || !title) {
    return response.status(400).json({ error: 'Missing id or title in query params' });
  }

  try {
    const pathname = `essays/${id}__${encodeURIComponent(title)}.pdf`;
    const body = await buffer(request);

    if (!body.length) {
      return response.status(400).json({ error: 'Empty file body' });
    }

    const blob = await put(pathname, body, {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false,
    });

    return response.status(200).json(blob);
  } catch (error) {
    console.error('Upload error:', error);
    return response.status(500).json({ error: error.message });
  }
}
