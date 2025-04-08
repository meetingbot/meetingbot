# MeetingBot Next.JS Server

The `server` folder contains the backend implementation of the MeetingBot application. 
It is built using **Next.js** and includes APIs, database configurations, authentication, and other server-side utilities. 

This document provides an overview of the folder structure and how the components work together.




## **Getting Started**
To run the server locally, follow these steps:

Copy the `.env.example` file to `.env` and set the environment variables.
```bash
cp .env.example .env
```

Install dependencies:
```bash
pnpm install
```

Run the development server:
```bash
pnpm dev
```

---

## **Folder Structure**

### **public**
Provides assets and static files for the front-end application. 
This includes images, fonts, and other resources that are publicly accessible.

---

### **drizzle**
Contains database migration files and schema definitions for the application.
- **Migrations**: SQL files for creating and updating database tables.
- **Schema Definitions**: Defines the structure of tables and relationships using Drizzle ORM.
---

### **tests-e2e**
Contains end-to-end tests for the frontend and backend application -- ensuring the application works as expected from a user's perspective.
It also includes Frontend component tests to ensure our visual components are working as expected.

---

```
src/server
├── README.md
├── eslint.config.js
├── jest.setup.js
├── next.config.js
├── playwright.config.ts
├── pnpm-workspace.yaml
├── postcss.config.js
├── prettier.config.js
├── drizzle
│ ├── 0000_square_exiles.sql
│ └── config.ts
|
├── public
│ └── platform-logos
|
├── src
│ ├── app                  # The Actual Endpoint Routes
│ │ ├── tests
│ │ ├── api                 # Backend API routes for the application.
│ │ │ ├── auth              
│ │ │ │ └── route.ts
│ │ │ ├── trpc
│ │ │ │ └── [trpc]
│ │ │ │   └── route.ts
│ │ │ └── [...trpc]
│ │ │   └── route.ts
│ │ ├── bots                # (Page) Bots page for managing bots.
│ │ │ └── page.tsx
│ │ ├── components          # Reusable components for the application.
│ │ ├── docs                # (Page) Documentation page for the application.
│ │ ├── keys                # (Page) Key management page for managing API keys.
│ │ ├── usage               # (Page) Usage page for displaying usage statistics.  
│ │ ├── page.tsx            # (Page) Main page of the frontend application.
│ │ └── __tests__           # tests for frontend
│ |           
│ ├── components            
│ ├── lib              
│ ├── styles                # Global Styles     
| ├── trpc                  # tRPC access
| |
| ├── server                  # Configuration files for the server-side application 
│ │ ├── api
│ │ │ ├── routers             # tRPC endPoints -- the actual backend APIS 
│ │ │ │ ├── apiKeys.ts           # API keys management APIs
│ │ │ │ ├── bots.ts              # Bots management APIs
│ │ │ │ ├── community.ts         # Community APIs
│ │ │ │ ├── events.ts            # Event APIs
│ │ │ │ └── usage.ts             # Usage Rate APIs
│ │ │ ├── services            # Service functions for backend to use
│ │ │ │ └── botDeployment.ts    # Deploying Bot functionality 
│ │ │ ├── root.ts             # Main Router
│ │ │ └── trpc.ts
│ │ |
│ │ ├── auth               # Authentication Configuration
│ │ │ ├── config.ts
│ │ │ └── index.ts
│ │ ├── db                 # Database configuration and schema definitions.
│ │ │ ├── index.ts
│ │ │ └── schema.ts
│ │ ├── utils              # Utility functions and helpers for the server-side application.  
│ │ │ └── s3.ts       
│ │ └── botDeployment.ts   # File for deploying bots to the server.    
```

In essense:
- `src/server/src/app` contains the frontend application code, pages, and components.
- `src/server/src/server` contains the backend application code, including API routes, authentication, database configuration, and utility functions.
- `src/server/src/app/api` gives access to the backend API routes.


---

## **Key Components**

### **tRPC API**
- The tRPC API is initialized in `api/trpc.ts`.
- Provides a type-safe way to define and consume APIs.
- Includes middleware for authentication and request timing.

### **Authentication**
- Authentication is handled using NextAuth in `auth`.
- Supports session-based authentication and API key-based authentication.

### **Database**
- The database is configured using Drizzle ORM in `db`.
- Schema definitions include tables for users, API keys, and request logs.

### **Styling**
- Global styles are defined in `styles/globals.css`.
- Uses TailwindCSS for utility-first styling.

---

## **How It Works**

1. **API Requests**:
   - API requests are routed through tRPC procedures defined in `api/trpc.ts`.
   - Middleware ensures authentication and logs request details.

2. **Authentication**:
   - Users can authenticate using NextAuth or API keys.
   - API keys are validated against the database and logged for auditing.

3. **Database Operations**:
   - Database interactions are performed using Drizzle ORM.
   - Schema definitions ensure type safety and consistency.

4. **Styling**:
   - TailwindCSS utilities are applied globally through `globals.css`.
   - Themes and custom variants are defined for consistent styling.

---

## **Development Notes**

- Use `pnpm` for managing dependencies. The workspace is defined in `pnpm-workspace.yaml`.
- Jest is configured for testing with `jest.setup.js`.
- Follow the folder structure and naming conventions for consistency.
