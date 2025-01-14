import { generateOpenApiDocument } from 'trpc-openapi'
import { appRouter } from './server'

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'MeetingBot API',
  description: 'API for managing meeting bots and users',
  version: '1.0.0',
  baseUrl: '/',
})
