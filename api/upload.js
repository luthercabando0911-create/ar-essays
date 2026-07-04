import { put } from '@vercel/blob';

// A plain server-side upload: the browser POSTs the raw PDF bytes straight
// to this function, which writes them to Vercel Blob. Simpler and more
// reliable than the client-token handshake, at the cost of Vercel's
// per-function body size limit (4.5MB on Hobby). Fine for essay PDFs —
// if you need bigger files later, we can revisit client uploads.

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

    const blob = await put(pathname, request.body, {
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
