import type { IncomingMessage, ServerResponse } from 'node:http';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({
    ok: true,
    service: 'invoiceflow-extraction-api',
    capabilities: {
      selectableTextPdf: true,
      scannedPdfOcr: false,
      maxUploadBytes: 4 * 1024 * 1024,
    },
  }));
}
