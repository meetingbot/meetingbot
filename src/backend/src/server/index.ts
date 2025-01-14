import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { createOpenApiExpressMiddleware } from 'trpc-openapi'
import swaggerUi from 'swagger-ui-express'
import cors from 'cors'
import { appRouter } from './server.js'
import { createTRPCContext } from './trpc.js'
import { openApiDocument } from './openapi.js'

const port = process.env.PORT || 3000

const app = express()

app.use(cors())

app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
)

app.use(
  '/api',
  createOpenApiExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
    responseMeta: undefined,
    onError: undefined,
    maxBodySize: undefined,
  })
)

app.use('/', swaggerUi.serve)

const main = async () => {
  app.get('/', swaggerUi.setup(openApiDocument))
  app.listen(port, () => {
    console.log('listening on http://127.0.0.1:3000')
  })
}

main()
