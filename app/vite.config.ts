import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { generateDraftResult, generateImportDraftResult, translateTextsWithGemini } from './src/server/aiDraft';

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
                  geminiModel: env.GEMINI_MODEL || 'gemini-2.5-flash',
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

            server.middlewares.use('/api/eletters/translate', async (req, res, next) => {
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
                const texts = Array.isArray(parsed?.texts)
                  ? parsed.texts.filter((value: unknown) => typeof value === 'string')
                  : [];
                const sourceLang = typeof parsed?.sourceLang === 'string' ? parsed.sourceLang : 'en';
                const targetLang = typeof parsed?.targetLang === 'string' ? parsed.targetLang : 'en';
                if (!texts.length) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ translations: [] }));
                  return;
                }
                const result = await translateTextsWithGemini(texts, sourceLang, targetLang, {
                  apiKey: env.GEMINI_API_KEY,
                  model: env.GEMINI_MODEL || 'gemini-2.5-flash',
                });
                if (result.error) {
                  res.statusCode = 502;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: result.error }));
                  return;
                }
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ translations: result.translations }));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Failed to translate text' }));
              }
            });

            server.middlewares.use('/api/eletters/import', async (req, res, next) => {
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
                const fileName = typeof parsed?.fileName === 'string' ? parsed.fileName : 'Imported questionnaire';
                const mimeType = typeof parsed?.mimeType === 'string' ? parsed.mimeType : 'application/octet-stream';
                const data = typeof parsed?.data === 'string' ? parsed.data : '';
                if (!data) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing file data' }));
                  return;
                }
                const result = await generateImportDraftResult(
                  { fileName, mimeType, data },
                  { geminiKey: env.GEMINI_API_KEY, geminiModel: env.GEMINI_MODEL || 'gemini-2.5-flash' },
                );
                if (result.error) {
                  res.statusCode = 502;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: result.error }));
                  return;
                }
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    draftJson: result.draftJson,
                    notes: result.notes,
                    warning: result.warning,
                    source: result.source,
                  }),
                );
              } catch {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Failed to import questionnaire' }));
              }
            });
          },
        };
        return plugin;
      })(),
    ],
  };
});
