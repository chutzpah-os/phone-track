import type { IncomingMessage, ServerResponse } from 'http';
import express, { type Express } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';

// Vercel reaproveita a instância entre invocações "quentes" da mesma function
// — inicializar o Nest (módulos, DI, Firebase Admin) só na primeira chamada
// evita pagar esse custo em toda requisição, só no cold start.
let appExpress: Express | undefined;

async function bootstrapServer(): Promise<Express> {
  if (!appExpress) {
    const instance = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(instance));
    const config = app.get(ConfigService);
    app.enableCors({ origin: config.get<string>('CORS_ORIGIN', 'http://localhost:3000') });
    await app.init();
    appExpress = instance;
  }
  return appExpress;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const server = await bootstrapServer();
  server(req, res);
}
