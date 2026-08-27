import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { handleStudentDoubt } from "./server/studentDoubtGroq";
import { handleGroqChat } from "./server/groqChat";
import { handleGeminiGenerate } from "./server/geminiGenerate";

// Read env variables (since we are outside defineConfig)
const env = loadEnv("", process.cwd(), "");
const SARVAM_API_KEY = env.SARVAM_API_KEY || "";
/** Server-only Groq key (never expose via VITE_). */
const GROQ_API_KEY = env.GROQ_API_KEY || "";
/** Server-only Gemini key (never expose via VITE_). */
const GEMINI_API_KEY = env.GEMINI_API_KEY || "";

/**
 * Sarvam TTS Proxy Plugin
 * Makes the Sarvam API call from Node.js (server-side) to bypass browser CORS.
 * Frontend calls POST /api/sarvam-tts  →  this middleware forwards to api.sarvam.ai
 */
function sarvamTTSPlugin() {
  return {
    name: "sarvam-tts-proxy",
    configureServer(server: {
      middlewares: { use: (path: string, fn: (...args: unknown[]) => void) => void };
    }) {
      server.middlewares.use("/api/sarvam-tts", async (req: unknown, res: unknown) => {
        const r = req as {
          method?: string;
          on: (ev: string, cb: (chunk?: Buffer) => void) => void;
        };
        const s = res as {
          setHeader: (k: string, v: string) => void;
          statusCode: number;
          end: (body?: string) => void;
        };
        s.setHeader("Access-Control-Allow-Origin", "*");
        s.setHeader("Access-Control-Allow-Headers", "content-type");
        if (r.method === "OPTIONS") {
          s.statusCode = 200;
          s.end();
          return;
        }
        if (r.method !== "POST") {
          s.statusCode = 405;
          s.end("Method Not Allowed");
          return;
        }

        let body = "";
        r.on("data", (chunk) => {
          body += chunk?.toString() ?? "";
        });
        r.on("end", async () => {
          try {
            const sarvamRes = await fetch("https://api.sarvam.ai/text-to-speech", {
              method: "POST",
              headers: {
                "api-subscription-key": SARVAM_API_KEY,
                "Content-Type": "application/json",
              },
              body,
            });
            const responseText = await sarvamRes.text();
            s.statusCode = sarvamRes.status;
            s.setHeader("Content-Type", "application/json");
            s.end(responseText);
          } catch (err) {
            const message = err instanceof Error ? err.message : "unknown";
            s.statusCode = 500;
            s.setHeader("Content-Type", "application/json");
            s.end(JSON.stringify({ error: "Sarvam proxy failed: " + message }));
          }
        });
      });
    },
  };
}

/**
 * Student doubt → Groq proxy (API key stays on the server).
 * Frontend: POST /api/student-doubt { question, lessonTitle, lessonContext, language }
 */
function studentDoubtPlugin() {
  return {
    name: "student-doubt-proxy",
    configureServer(server: {
      middlewares: { use: (path: string, fn: (...args: unknown[]) => void) => void };
    }) {
      server.middlewares.use("/api/student-doubt", (req: unknown, res: unknown) => {
        const r = req as {
          method?: string;
          on: (ev: string, cb: (chunk?: Buffer) => void) => void;
        };
        const s = res as {
          setHeader: (k: string, v: string) => void;
          statusCode: number;
          end: (body?: string) => void;
        };
        s.setHeader("Access-Control-Allow-Origin", "*");
        s.setHeader("Access-Control-Allow-Headers", "content-type");
        if (r.method === "OPTIONS") {
          s.statusCode = 200;
          s.end();
          return;
        }
        if (r.method !== "POST") {
          s.statusCode = 405;
          s.end("Method Not Allowed");
          return;
        }

        let body = "";
        r.on("data", (chunk) => {
          body += chunk?.toString() ?? "";
        });
        r.on("end", async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const result = await handleStudentDoubt(parsed, GROQ_API_KEY);
            s.setHeader("Content-Type", "application/json");
            if (!result.ok) {
              s.statusCode = result.status;
              s.end(JSON.stringify({ error: result.error }));
              return;
            }
            s.statusCode = 200;
            const { ok: _ok, ...payload } = result;
            s.end(JSON.stringify(payload));
          } catch (err) {
            const message = err instanceof Error ? err.message : "student-doubt proxy failed";
            s.statusCode = 500;
            s.setHeader("Content-Type", "application/json");
            s.end(JSON.stringify({ error: message }));
          }
        });
      });
    },
  };
}

/**
 * Generic Groq chat proxy for lesson inference (key stays on server).
 * Frontend: POST /api/groq-chat { messages, model?, temperature?, response_format? }
 */
function groqChatPlugin() {
  return {
    name: "groq-chat-proxy",
    configureServer(server: {
      middlewares: { use: (path: string, fn: (...args: unknown[]) => void) => void };
    }) {
      server.middlewares.use("/api/groq-chat", (req: unknown, res: unknown) => {
        const r = req as {
          method?: string;
          on: (ev: string, cb: (chunk?: Buffer) => void) => void;
        };
        const s = res as {
          setHeader: (k: string, v: string) => void;
          statusCode: number;
          end: (body?: string) => void;
        };
        s.setHeader("Access-Control-Allow-Origin", "*");
        s.setHeader("Access-Control-Allow-Headers", "content-type");
        if (r.method === "OPTIONS") {
          s.statusCode = 200;
          s.end();
          return;
        }
        if (r.method !== "POST") {
          s.statusCode = 405;
          s.end("Method Not Allowed");
          return;
        }

        let body = "";
        r.on("data", (chunk) => {
          body += chunk?.toString() ?? "";
        });
        r.on("end", async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const result = await handleGroqChat(parsed, GROQ_API_KEY);
            s.setHeader("Content-Type", "application/json");
            if (!result.ok) {
              s.statusCode = result.status;
              s.end(JSON.stringify({ error: result.error }));
              return;
            }
            s.statusCode = 200;
            s.end(JSON.stringify({ content: result.content }));
          } catch (err) {
            const message = err instanceof Error ? err.message : "groq-chat proxy failed";
            s.statusCode = 500;
            s.setHeader("Content-Type", "application/json");
            s.end(JSON.stringify({ error: message }));
          }
        });
      });
    },
  };
}

/**
 * Gemini generateContent proxy (key stays on server).
 * Frontend: POST /api/gemini-generate { prompt, model?, temperature?, json? }
 */
function geminiGeneratePlugin() {
  return {
    name: "gemini-generate-proxy",
    configureServer(server: {
      middlewares: { use: (path: string, fn: (...args: unknown[]) => void) => void };
    }) {
      server.middlewares.use("/api/gemini-generate", (req: unknown, res: unknown) => {
        const r = req as {
          method?: string;
          on: (ev: string, cb: (chunk?: Buffer) => void) => void;
        };
        const s = res as {
          setHeader: (k: string, v: string) => void;
          statusCode: number;
          end: (body?: string) => void;
        };
        s.setHeader("Access-Control-Allow-Origin", "*");
        s.setHeader("Access-Control-Allow-Headers", "content-type");
        if (r.method === "OPTIONS") {
          s.statusCode = 200;
          s.end();
          return;
        }
        if (r.method !== "POST") {
          s.statusCode = 405;
          s.end("Method Not Allowed");
          return;
        }

        let body = "";
        r.on("data", (chunk) => {
          body += chunk?.toString() ?? "";
        });
        r.on("end", async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const result = await handleGeminiGenerate(parsed, GEMINI_API_KEY);
            s.setHeader("Content-Type", "application/json");
            if (!result.ok) {
              s.statusCode = result.status;
              s.end(JSON.stringify({ error: result.error }));
              return;
            }
            s.statusCode = 200;
            s.end(JSON.stringify({ text: result.text }));
          } catch (err) {
            const message = err instanceof Error ? err.message : "gemini proxy failed";
            s.statusCode = 500;
            s.setHeader("Content-Type", "application/json");
            s.end(JSON.stringify({ error: message }));
          }
        });
      });
    },
  };
}

/**
 * Unverified Data Saver Plugin — saves AI-generated answers locally for review.
 */
function unverifiedDataSaverPlugin() {
  return {
    name: "unverified-data-saver",
    configureServer(server: {
      middlewares: { use: (path: string, fn: (...args: unknown[]) => void) => void };
    }) {
      server.middlewares.use("/api/save-unverified", (req: unknown, res: unknown) => {
        const r = req as {
          method?: string;
          on: (ev: string, cb: (chunk?: Buffer) => void) => void;
        };
        const s = res as { statusCode: number; end: (body?: string) => void };
        if (r.method === "POST") {
          let body = "";
          r.on("data", (chunk) => {
            body += chunk?.toString() ?? "";
          });
          r.on("end", () => {
            const filePath = path.resolve(__dirname, "./src/data/unverified_datas.json");
            let data: unknown[] = [];
            if (fs.existsSync(filePath)) {
              try {
                data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown[];
              } catch {
                data = [];
              }
            }
            data.push(JSON.parse(body));
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            s.statusCode = 200;
            s.end("Saved");
          });
        }
      });

      server.middlewares.use("/api/save-master-datas", (req: unknown, res: unknown) => {
        const r = req as {
          method?: string;
          on: (ev: string, cb: (chunk?: Buffer) => void) => void;
        };
        const s = res as {
          setHeader: (k: string, v: string) => void;
          statusCode: number;
          end: (body?: string) => void;
        };
        s.setHeader("Access-Control-Allow-Origin", "*");
        s.setHeader("Access-Control-Allow-Headers", "content-type");
        if (r.method === "OPTIONS") {
          s.statusCode = 200;
          s.end();
          return;
        }
        if (r.method !== "POST") {
          s.statusCode = 405;
          s.end("Method Not Allowed");
          return;
        }

        let body = "";
        r.on("data", (chunk) => {
          body += chunk?.toString() ?? "";
        });
        r.on("end", () => {
          try {
            const filePath = path.resolve(__dirname, "./src/data/master_datas.json");
            let data: unknown[] = [];
            if (fs.existsSync(filePath)) {
              try {
                data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown[];
              } catch {
                data = [];
              }
            }
            if (!Array.isArray(data)) data = [];
            data.push(JSON.parse(body));
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            s.statusCode = 200;
            s.setHeader("Content-Type", "application/json");
            s.end(JSON.stringify({ ok: true, count: data.length }));
          } catch (err) {
            const message = err instanceof Error ? err.message : "save failed";
            s.statusCode = 500;
            s.end(JSON.stringify({ error: message }));
          }
        });
      });
    },
  };
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
    studentDoubtPlugin(),
    groqChatPlugin(),
    geminiGeneratePlugin(),
    unverifiedDataSaverPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
