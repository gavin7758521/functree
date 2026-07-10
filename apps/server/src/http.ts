import {
  CreateAlignmentSchema,
  CreateFeatureSchema,
  CreateFeatureSetSchema,
  CreateProjectSchema,
  QueryContextSchema,
  labels
} from '@functree/domain';
import fastify, { type FastifyInstance } from 'fastify';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError, z } from 'zod';
import type { Db } from './database.js';
import { FuncTreeRepository, NotFoundError, ValidationError } from './repository.js';
import { callTool, toolDefinitions } from './tools.js';

export function createHttpServer(db: Db): FastifyInstance {
  const repo = new FuncTreeRepository(db);

  const app = fastify({
    logger: false,
    bodyLimit: 1024 * 1024
  });

  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'"
    );
    return payload;
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({ error: '输入校验失败', details: error.issues });
      return;
    }
    if (error instanceof NotFoundError) {
      reply.status(404).send({ error: error.message });
      return;
    }
    if (error instanceof ValidationError) {
      reply.status(400).send({ error: error.message });
      return;
    }
    console.error(error);
    reply.status(500).send({ error: '服务端处理失败。' });
  });

  app.get('/health', async () => ({ ok: true, name: 'FuncTree' }));
  app.get('/api/catalog', async () => ({ labels }));
  app.get('/api/overview', async () => repo.overview());

  app.get('/api/projects', async () => repo.listProjects());
  app.post('/api/projects', async (request) => repo.createProject(CreateProjectSchema.parse(request.body)));
  app.get('/api/projects/:projectId', async (request) => repo.getProject(params(request).projectId));
  app.get('/api/projects/:projectId/tree', async (request) => repo.getProjectTree(params(request).projectId));

  app.get('/api/projects/:projectId/feature-sets', async (request) => repo.listFeatureSets(params(request).projectId));
  app.post('/api/projects/:projectId/feature-sets', async (request) => {
    const input = CreateFeatureSetSchema.parse(request.body);
    return repo.createFeatureSet(params(request).projectId, input);
  });

  app.get('/api/projects/:projectId/features', async (request) => repo.listFeatures(params(request).projectId));
  app.post('/api/feature-sets/:featureSetId/features', async (request) => {
    const input = CreateFeatureSchema.parse(request.body);
    return repo.createFeature(params(request).featureSetId, input);
  });

  app.get('/api/projects/:projectId/alignments', async (request) => repo.listAlignments(params(request).projectId));
  app.post('/api/projects/:projectId/alignments', async (request) => {
    const input = CreateAlignmentSchema.parse(request.body);
    return repo.createAlignment(params(request).projectId, input);
  });

  app.get('/api/mcp/tools', async () => ({ tools: toolDefinitions }));
  app.post('/api/mcp/call', async (request) => {
    const body = z.object({ name: z.string().min(1), arguments: z.unknown().optional() }).parse(request.body);
    return callTool(repo, body.name, body.arguments ?? {});
  });

  app.get('/api/query', async (request) => repo.queryContext(QueryContextSchema.parse(request.query)));

  app.get('/*', async (request, reply) => serveStatic(request.url, reply));

  return app;
}

function params(request: { params: unknown }): Record<string, string> {
  return request.params as Record<string, string>;
}

async function serveStatic(url: string, reply: { header: (name: string, value: string) => void; status: (code: number) => unknown; send: (body?: unknown) => void }) {
  const staticDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');
  const pathname = new URL(url, 'http://localhost').pathname;
  if (pathname === '/favicon.ico') {
    reply.status(204);
    reply.send();
    return;
  }

  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(staticDir, `.${requested}`);
  if (!filePath.startsWith(staticDir)) {
    reply.status(403);
    reply.send('禁止访问');
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    reply.header('content-type', contentType(filePath));
    reply.send(content);
  } catch {
    reply.status(404);
    reply.send('Web 管理台尚未构建，请运行 pnpm --filter @functree/web build。');
  }
}

function contentType(filePath: string): string {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}
