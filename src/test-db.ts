import { DatabaseValidator } from './validators/database-validator';
import { SchemaLoader } from './validators/schema-loader';
import * as path from 'path';
import * as fs from 'fs';

async function testDb() {
  // Load config
  const configPath = path.join(process.cwd(), 'observer.config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  // Load schemas
  const loader = new SchemaLoader();
  const registry = await loader.loadProjectSchemas(path.resolve(config.schemaPath));
  
  // Connect to database
  const dbValidator = new DatabaseValidator(config.database, registry);
  await dbValidator.connect();
  
  // Validate a table
  const mismatches = await dbValidator.validateTable('User', 'users');
  dbValidator.printMismatches(mismatches);
  
  await dbValidator.disconnect();
}

testDb().catch(console.error);