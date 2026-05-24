import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

const app = express();
const PORT = 3000;
app.use(express.json());

// mock DB
const mockProjects: Record<string, any> = {
  "proj-1": {
    id: "proj-1",
    name: "SaaS Platform",
    description: "Main application feature flags",
    environments: [
      { id: "env-prod", name: "Production", sdkKey: "sdk-prod-123" },
      { id: "env-dev", name: "Development", sdkKey: "sdk-dev-456" }
    ]
  }
};

const mockFlags: Record<string, any> = {
  "flag-1": {
    id: "flag-1",
    projectId: "proj-1",
    envId: "env-prod",
    key: "new-checkout",
    name: "New Checkout Flow",
    description: "Enables the responsive checkout experience",
    type: "boolean",
    active: true,
    rules: [
      {
        id: "rule-1",
        attribute: "country",
        operator: "in",
        value: "US,CA",
        type: "boolean",
        serveValue: "true"
      }
    ],
    rollout: {
      percentage: 20,
      serveValue: "true",
      fallbackValue: "false"
    },
    createdAt: Date.now() - 100000,
    updatedAt: Date.now()
  }
};

let clients: { id: string; res: express.Response; sdkKey: string }[] = [];

function notifyClients(sdkKey: string, flag: any) {
  const data = JSON.stringify({ type: "update", flag });
  clients.forEach(c => {
    if (c.sdkKey === sdkKey) {
      c.res.write(`data: ${data}\n\n`);
    }
  });
}

function parseValue(type: string, val: string): any {
  if (type === 'boolean') return val === 'true';
  if (type === 'json') {
    try { return JSON.parse(val); } catch { return null; }
  }
  return val;
}

// ----- REST API for Admin Dashboard -----
app.get("/api/projects", (req, res) => {
  res.json(Object.values(mockProjects));
});

app.get("/api/projects/:projectId/flags", (req, res) => {
  const envId = req.query.envId as string;
  const flags = Object.values(mockFlags).filter(f => f.projectId === req.params.projectId && (!envId || f.envId === envId));
  res.json(flags);
});

app.post("/api/projects/:projectId/flags", (req, res) => {
  const { envId, key, name, description, type, active, rules, rollout } = req.body;
  const id = crypto.randomUUID();
  const flag = {
    id,
    projectId: req.params.projectId,
    envId, key, name, description, type, active, rules, rollout,
    createdAt: Date.now(), updatedAt: Date.now()
  };
  mockFlags[id] = flag;
  
  const proj = mockProjects[req.params.projectId];
  if (proj) {
    const env = proj.environments.find((e: any) => e.id === envId);
    if (env) notifyClients(env.sdkKey, flag);
  }
  res.json(flag);
});

app.put("/api/flags/:flagId", (req, res) => {
  const flag = mockFlags[req.params.flagId];
  if (!flag) return res.status(404).json({ error: "Not found" });
  
  Object.assign(flag, req.body, { updatedAt: Date.now() });
  
  const proj = mockProjects[flag.projectId];
  if (proj) {
    const env = proj.environments.find((e: any) => e.id === flag.envId);
    if (env) notifyClients(env.sdkKey, flag);
  }
  
  res.json(flag);
});

// ----- Eval Engine (SDK requests) -----
app.post("/api/evaluate", (req, res) => {
  const sdkKey = req.headers.authorization?.replace("Bearer ", "");
  if (!sdkKey) return res.status(401).json({ error: "Missing SDK key" });
  
  // Find project env
  let envId = null;
  let projectId = null;
  for (const proj of Object.values(mockProjects)) {
    const env = proj.environments.find((e: any) => e.sdkKey === sdkKey);
    if (env) {
      envId = env.id;
      projectId = proj.id;
      break;
    }
  }
  if (!envId) return res.status(401).json({ error: "Invalid SDK key" });

  const context = req.body.context || {};
  const flags = Object.values(mockFlags).filter(f => f.envId === envId);
  const results: Record<string, any> = {};

  for (const flag of flags) {
    if (!flag.active) {
      results[flag.key] = { value: parseValue(flag.type, flag.rollout.fallbackValue), reason: 'disabled' };
      continue;
    }

    let matched = false;
    for (const rule of flag.rules) {
      const ctxVal = context[rule.attribute];
      if (ctxVal === undefined || ctxVal === null) continue;
      
      let pass = false;
      const rVals = rule.value.split(',').map((v: string) => v.trim());
      
      if (rule.operator === 'eq') pass = String(ctxVal) === rule.value;
      if (rule.operator === 'neq') pass = String(ctxVal) !== rule.value;
      if (rule.operator === 'in') pass = rVals.includes(String(ctxVal));
      if (rule.operator === 'nin') pass = !rVals.includes(String(ctxVal));
      if (rule.operator === 'contains') pass = String(ctxVal).includes(rule.value);
      
      if (pass) {
        results[flag.key] = { value: parseValue(flag.type, rule.serveValue), reason: `rule match: ${rule.id}` };
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Rollout
    const hashStr = flag.key + (context.userId || "anonymous");
    const hash = crypto.createHash('md5').update(hashStr).digest('hex');
    const bucket = parseInt(hash.substring(0, 8), 16) % 100;
    
    if (bucket < flag.rollout.percentage) {
      results[flag.key] = { value: parseValue(flag.type, flag.rollout.serveValue), reason: 'rollout' };
    } else {
      results[flag.key] = { value: parseValue(flag.type, flag.rollout.fallbackValue), reason: 'fallback' };
    }
  }

  res.json({ results });
});

app.get("/api/stream", (req, res) => {
  const sdkKey = req.query.sdkKey as string;
  if (!sdkKey) return res.status(401).send("Missing sdkKey");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const clientId = crypto.randomUUID();
  clients.push({ id: clientId, res, sdkKey });

  req.on("close", () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
