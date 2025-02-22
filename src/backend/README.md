# MeetingBot Backend

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### Project Initialization

1. Navigate to the backend folder:

   ```
   cd src/backend
   ```

2. Install dependencies using pnpm:

   ```
   pnpm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration (`DATABASE_URL` in particular)

### Running the Server

To start the server, run:

```
pnpm dev
```

The Express app will run at `http://127.0.0.1:{env.PORT}`.

### Technology Stack

- **Express**: Web framework for handling HTTP requests and middleware
- **tRPC**: End-to-end typesafe API layer with automatic OpenAPI generation
- **Drizzle ORM**: Typesafe SQL query builder and schema definition
- **PostgreSQL**: Relational database for storing user and bot data
- **Swagger UI**: Interactive API documentation viewer

### API Documentation

After running the server, you can access the API documentation.

### Testing

The test suite has not been implemented yet. This section will be updated once testing is set up.

### Docker

Docker support has not been implemented yet. This section will be updated once Docker configuration is set up.
