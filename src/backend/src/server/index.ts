import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { createOpenApiExpressMiddleware } from 'trpc-openapi'
import swaggerUi from 'swagger-ui-express'
import cors from 'cors'
import { createTRPCContext } from './trpc.js'
import { openApiDocument } from './openapi.js'
import { appRouter } from '../routers/index.js'

const port = process.env.PORT || 3001

const app = express()

app.use(cors())

// This endpoint is used by tRPC clients for type-safe API calls
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
)

// This endpoint allows standard HTTP clients to access the API using REST conventions
app.use(
  '/api',
  createOpenApiExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
)

app.use('/', swaggerUi.serve)

const main = async () => {
  app.get('/', swaggerUi.setup(openApiDocument))
  app.listen(port, () => {
    console.log('listening on http://127.0.0.1:' + port)
  })
}

main()
