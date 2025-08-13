// Script to initialize the test database in CI environments
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('Initializing test database for CI...');

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run drizzle migrations
const migrationsPath = path.join(__dirname, '..', 'drizzle');
console.log(`Looking for migrations in: ${migrationsPath}`);

exec(`npx drizzle-kit push`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running migrations: ${error.message}`);
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`Migration stderr: ${stderr}`);
  }
  
  console.log(`Migration stdout: ${stdout}`);
  console.log('Test database initialized successfully');
}); 