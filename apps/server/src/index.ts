#!/usr/bin/env node
import { openDatabase } from './database.js';
import { createHttpServer } from './http.js';

const args = new Map<string, string>();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (key?.startsWith('--') && value) {
    args.set(key.slice(2), value);
  }
}

const host = args.get('host') ?? process.env.FUNCTREE_HOST ?? '127.0.0.1';
const port = Number(args.get('port') ?? process.env.FUNCTREE_PORT ?? 4174);
const db = openDatabase(args.get('db') ?? process.env.FUNCTREE_DB);
const app = createHttpServer(db);

await app.listen({ host, port });
console.log(`FuncTree 服务端已启动: http://${host}:${port}`);
