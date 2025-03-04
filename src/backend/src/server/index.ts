import express, { NextFunction, Request, Response } from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { createOpenApiExpressMiddleware } from 'trpc-openapi'
import swaggerUi from 'swagger-ui-express'
import cors from 'cors'
import { createTRPCContext } from './trpc.js'
import { openApiDocument } from './openapi.js'
import { appRouter } from '../routers/index.js'
import { ExpressAuth } from '@auth/express'
import { authConfig } from './auth.js'
import { getSession } from '@auth/express'

const port = process.env.PORT || 3001

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// This endpoint is used by the auth router
app.set('trust proxy', true)

// Move auth under /api
app.use('/api/auth/*', ExpressAuth(authConfig))
// add the session to the request object
app.use(async (req: Request, res: Response, next: NextFunction) => {
  res.locals.session = await getSession(req, authConfig)
  next()
})

// This endpoint is used by tRPC clients for type-safe API calls
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
)

// Set up Swagger UI at /docs
app.use('/docs', swaggerUi.serve)

// This endpoint allows standard HTTP clients to access the API using REST conventions
app.use(
  '/api',
  createOpenApiExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
)

const main = async () => {
  app.get('/docs', swaggerUi.setup(openApiDocument))
  app.listen(port, () => {
    console.log('listening on http://localhost:' + port)
  })
}

main()
