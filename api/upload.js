import { handleUpload } from '@vercel/blob/client';

// This endpoint powers CLIENT-SIDE uploads: the browser talks to Vercel Blob
// directly (so large PDFs aren't limited by a serverless function's request
// body size). This route only ever issues a short-lived upload token and,
// optionally, gets notified once the upload finishes.

export default async function handler(request, response) {
  const body = request.body;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Only allow PDFs to land under essays/, named like:
        //   essays/<id>__<url-encoded-title>.pdf
        if (!pathname.startsWith('essays/') || !pathname.endsWith('.pdf')) {
          throw new Error('Invalid upload path');
        }

        return {
          allowedContentTypes: ['application/pdf'],
          addRandomSuffix: false, // keep the pathname we chose, so we can parse id/title back out
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB per essay, adjust as needed
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Nothing else to persist — the blob's own pathname/url IS the record.
        console.log('Essay uploaded:', blob.pathname);
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    console.error('Upload token error:', error);
    return response.status(400).json({ error: error.message });
  }
}
