import { Client } from 'pg';
import { SchemaRegistry } from './schema-registry';
import chalk from 'chalk';

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

export interface TableMismatch {
  table: string;
  field: string;
  issue: 'missing_in_db' | 'missing_in_schema' | 'type_mismatch' | 'nullable_mismatch';
  expected?: string;
  found?: string;
}

export class DatabaseValidator {
  private client: Client;
  private registry: SchemaRegistry;

  constructor(config: DatabaseConfig, registry: SchemaRegistry) {
    this.client = new Client(config);
    this.registry = registry;
  }

  async connect() {
    try {
      await this.client.connect();
      console.log(chalk.green('✓ Connected to database'));
    } catch (error) {
      console.log(chalk.red('✗ Failed to connect to database'));
      throw error;
    }
  }

  async disconnect() {
    await this.client.end();
  }

  async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `;
    
    const result = await this.client.query(query, [tableName]);
    return result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES'
    }));
  }

  async validateTable(schemaName: string, tableName: string): Promise<TableMismatch[]> {
    const schema = this.registry.getSchema(schemaName);
    if (!schema) {
      console.log(chalk.yellow(`No schema found for ${schemaName}`));
      return [];
    }

    const columns = await this.getTableColumns(tableName);
    const mismatches: TableMismatch[] = [];

    // Check each schema field against database
    schema.fields.forEach((expectedType, fieldName) => {
      const column = columns.find(c => c.name === fieldName);
      
      if (!column) {
        mismatches.push({
          table: tableName,
          field: fieldName,
          issue: 'missing_in_db',
          expected: expectedType
        });
      }
    });

    // Check for extra columns in database
    columns.forEach(column => {
      if (!schema.fields.has(column.name)) {
        mismatches.push({
          table: tableName,
          field: column.name,
          issue: 'missing_in_schema',
          found: column.type
        });
      }
    });

    return mismatches;
  }

  printMismatches(mismatches: TableMismatch[]) {
    if (mismatches.length === 0) {
      console.log(chalk.green('✓ Database matches schemas'));
      return;
    }

    console.log(chalk.red(`\n❌ Found ${mismatches.length} database issue(s):\n`));
    
    mismatches.forEach(mismatch => {
      console.log(chalk.yellow(`Table: ${mismatch.table}`));
      
      switch (mismatch.issue) {
        case 'missing_in_db':
          console.log(chalk.red(`  Field '${mismatch.field}' missing in database (expected ${mismatch.expected})`));
          break;
        case 'missing_in_schema':
          console.log(chalk.red(`  Field '${mismatch.field}' in database but not in schema (type: ${mismatch.found})`));
          break;
        case 'type_mismatch':
          console.log(chalk.red(`  Field '${mismatch.field}' type mismatch: expected ${mismatch.expected}, found ${mismatch.found}`));
          break;
      }
    });
    console.log();
  }
}