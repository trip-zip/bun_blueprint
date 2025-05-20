# Bun Blueprint

A modern web application template built with Bun, React, Tailwind CSS, and ShadCN UI components.

## Overview

This template provides a ready-to-use starting point for web applications that leverage Bun's native functionality. It's designed to get you up and running quickly with:

- A complete setup for Bun with React, Tailwind, and ShadCN UI
- Database integration with migration support out of the box
- Development environment with hot reloading
- Production build configuration

Ideal for developers who want to start building with Bun without the initial configuration hassle.

## Prerequisites

- [Bun](https://bun.sh/) (v1.2.13 or newer)
- [PostgreSQL](https://www.postgresql.org/) (recommended)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/bun_blueprint.git
cd bun_blueprint
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up your database

Create a `.env` file in the project root with your database connection details:

```
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
```

Replace `username`, `password`, and `your_database_name` with your PostgreSQL credentials.

> 💡 **Tip:** PostgreSQL is recommended, but you can use any database supported by Bun's SQL module.

### 4. Run database migrations

Set up the database schema by running migrations:

```bash
bun migrate
```

### 5. Start the development server

```bash
bun dev
```

Your application should now be running at [http://localhost:3000](http://localhost:3000).

## Database Management Commands

This project comes with built-in database migration tools:

```bash
# Run all pending migrations
bun migrate

# Create a new migration file
bun migrate:create migration_name

# Roll back the most recent migration
bun migrate:down

# Verify migration integrity
bun migrate:check
```

## Database Connection Validation

To check if your database connection is working properly:

```bash
# Add this to a temporary script or run in a REPL
import { testConnection } from './db';

const isConnected = await testConnection();
console.log('Database connection:', isConnected ? 'Successful' : 'Failed');
```

## Build for Production

Compile your application for production:

```bash
bun run build
```

## Run in Production Mode

```bash
bun start
```

## Project Structure

```
bun_blueprint/
├── public/          # Static assets
├── src/             # Application source code
├── db/              # Database migrations and utilities
│   ├── migrations/  # Migration files
│   ├── migrate.js   # Migration runner
│   └── migration_template  # Template for new migrations
├── .env             # Environment variables
├── db.ts            # Database connection setup
├── build.ts         # Build configuration
└── ... other configuration files
```

## Creating New Features

1. Create React components in the `src/components` directory
2. Add new routes in the appropriate router file
3. Create new database migrations with `bun migrate:create`
4. Run migrations with `bun migrate`

## Using ShadCN UI Components

This project includes ShadCN UI components. You can add new components as needed:

```bash
# Example - only if you have shadcn/ui CLI installed
bunx shadcn-ui@latest add button
```

Alternatively, you can manually add components from the ShadCN documentation.

## Troubleshooting

### Database Connection Issues

- Verify your `.env` file has the correct `DATABASE_URL` format
- Ensure your PostgreSQL server is running
- Check username and password credentials
- Verify the database exists

### Hot Reload Not Working

- Restart the development server with `bun dev`
- Check for errors in the console output

## License

[MIT](LICENSE)

---

Built with [Bun](https://bun.sh)
