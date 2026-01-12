import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { generateDraftResult } from './src/server/aiDraft';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      (() => {
        const plugin: Plugin = {
          name: 'eletters-ai-draft-api',
          configureServer(server) {
            server.middlewares.use('/api/eletters/ai-draft', async (req, res, next) => {
              if (!req.url) return next();
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }

              try {
                let body = '';
                await new Promise<void>((resolve, reject) => {
                  req.on('data', (chunk) => {
                    body += chunk;
                  });
                  req.on('end', () => resolve());
                  req.on('error', (err) => reject(err));
                });

                const parsed = body ? (JSON.parse(body) as any) : {};
                const prompt = typeof parsed?.prompt === 'string' ? parsed.prompt : '';
                const currentDraftJson = parsed?.currentDraftJson;
                if (!prompt.trim()) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing prompt' }));
                  return;
                }

                const result = await generateDraftResult(prompt, {
                  openAiKey: env.OPENAI_API_KEY,
                  geminiKey: env.GEMINI_API_KEY,
                  currentDraftJson,
                });
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ draftJson: result.letter, source: result.source, warning: result.warning }));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Failed to generate draft' }));
              }
            });
          },
        };
        return plugin;
      })(),
    ],
  };
});
