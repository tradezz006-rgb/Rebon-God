import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// Read env variables (since we are outside defineConfig)
const env = loadEnv('', process.cwd(), '');
const SARVAM_API_KEY = env.SARVAM_API_KEY || "";

/**
 * Sarvam TTS Proxy Plugin
 * Makes the Sarvam API call from Node.js (server-side) to bypass browser CORS.
 * Frontend calls POST /api/sarvam-tts  →  this middleware forwards to api.sarvam.ai
 */
function sarvamTTSPlugin() {
  return {
    name: 'sarvam-tts-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/sarvam-tts', async (req: any, res: any) => {
        // Handle CORS preflight
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'content-type');
        if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return; }
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method Not Allowed'); return; }

        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            console.log('[Sarvam Proxy] Forwarding TTS request to api.sarvam.ai...');
            const sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
              method: 'POST',
              headers: {
                'api-subscription-key': SARVAM_API_KEY,
                'Content-Type': 'application/json',
              },
              body,
            });

            const responseText = await sarvamRes.text();
            console.log(`[Sarvam Proxy] Response status: ${sarvamRes.status}`);

            res.statusCode = sarvamRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(responseText);
          } catch (err: any) {
            console.error('[Sarvam Proxy] Error:', err.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Sarvam proxy failed: ' + err.message }));
          }
        });
      });
    }
  };
}

/**
 * Unverified Data Saver Plugin — saves AI-generated answers locally for review.
 */
function unverifiedDataSaverPlugin() {
  return {
    name: 'unverified-data-saver',
    configureServer(server: any) {
      server.middlewares.use('/api/save-unverified', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk.toString(); });
          req.on('end', () => {
            const filePath = path.resolve(__dirname, './src/data/unverified_datas.json');
            let data = [];
            if (fs.existsSync(filePath)) {
              try { data = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch(e) {}
            }
            data.push(JSON.parse(body));
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            res.statusCode = 200;
            res.end('Saved');
          });
        }
      });
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    sarvamTTSPlugin(),
    unverifiedDataSaverPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
