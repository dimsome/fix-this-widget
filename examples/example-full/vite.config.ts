import { Buffer } from 'node:buffer';
import { createFixThisWidgetHandler } from 'fix-this-widget/server';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

function fixThisWidgetFeedbackEndpoint(): Plugin {
  const handler = createFixThisWidgetHandler({
    filePath: 'feedback/fix-this-widget.full.example.jsonl',
  });

  return {
    name: 'fix-this-widget-feedback-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/fix-this-widget/full-config-feedback', async (request, response) => {
        const chunks: Buffer[] = [];
        for await (const chunk of request) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        const body = Buffer.concat(chunks);
        const feedbackResponse = await handler(new Request('http://localhost/api/fix-this-widget/full-config-feedback', {
          method: request.method,
          headers: request.headers as HeadersInit,
          body: body.length > 0 ? body : undefined,
        }));

        response.statusCode = feedbackResponse.status;
        feedbackResponse.headers.forEach((value, key) => response.setHeader(key, value));
        response.end(Buffer.from(await feedbackResponse.arrayBuffer()));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), fixThisWidgetFeedbackEndpoint()],
});
