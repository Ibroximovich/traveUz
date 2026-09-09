import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app: Application = express();

// ─── Static Uploads Directory ───────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Security Middleware ───────────────────────────────────────────────────────
// Helmet: Swagger UI uchun CSP ni yumshataymiz
app.use(
  helmet({
    contentSecurityPolicy: env.isDev ? false : undefined,
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      // In dev mode allow any localhost origin or no origin (Postman/curl)
      if (!origin || env.isDev || origin === env.clientUrl) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  }),
);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging (Dev) ─────────────────────────────────────────────────────
if (env.isDev) {
  app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.path}`);
    next();
  });
}

// ─── Swagger Docs ─────────────────────────────────────────────────────────────
if (env.isDev) {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Tripuz API Docs',
      customCss: `
        .swagger-ui .topbar { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .swagger-ui .topbar-wrapper img { content: url('https://ui-avatars.com/api/?name=Tripuz&background=6366f1&color=fff&size=40'); }
        .swagger-ui .info .title { color: #4f46e5; font-size: 2rem; }
        .swagger-ui .scheme-container { background: #f8fafc; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    }),
  );
  // Raw JSON spec endpoint
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  console.log(`📚 Swagger docs: http://localhost:${env.port}/api/docs`);
}

import { languageMiddleware } from './middlewares/language.middleware';

// ─── Language Middleware ───────────────────────────────────────────────────────
app.use(languageMiddleware);

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
