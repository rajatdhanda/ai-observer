import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { TypeSystem, TypeDefinition, PropertyDefinition } from './index';

export class TypeExtractor {
  async extract(projectPath: string): Promise<TypeSystem> {
    const typeFiles = this.findTypeFiles(projectPath);
    const interfaces: TypeDefinition[] = [];
    const types: TypeDefinition[] = [];
    const enums: TypeDefinition[] = [];

    for (const file of typeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const sourceFile = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      this.extractFromFile(sourceFile, file, interfaces, types, enums);
    }

    return {
      interfaces,
      types,
      enums,
      totalCount: interfaces.length + types.length + enums.length,
      files: typeFiles.map(f => path.relative(projectPath, f))
    };
  }

  private findTypeFiles(projectPath: string): string[] {
    const typeFiles: string[] = [];
    const extensions = ['.ts', '.tsx'];
    const excludeDirs = ['node_modules', '.next', 'dist', 'build', '.git'];

    const walkDir = (dir: string) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (!excludeDirs.includes(file)) {
            walkDir(filePath);
          }
        } else if (extensions.some(ext => file.endsWith(ext))) {
          typeFiles.push(filePath);
        }
      }
    };

    walkDir(projectPath);
    return typeFiles;
  }

  private extractFromFile(
    sourceFile: ts.SourceFile,
    filePath: string,
    interfaces: TypeDefinition[],
    types: TypeDefinition[],
    enums: TypeDefinition[]
  ) {
    const visit = (node: ts.Node) => {
      if (ts.isInterfaceDeclaration(node)) {
        interfaces.push(this.extractInterface(node, filePath));
      } else if (ts.isTypeAliasDeclaration(node)) {
        types.push(this.extractType(node, filePath));
      } else if (ts.isEnumDeclaration(node)) {
        enums.push(this.extractEnum(node, filePath));
      }
      
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  private extractInterface(node: ts.InterfaceDeclaration, filePath: string): TypeDefinition {
    const properties: PropertyDefinition[] = [];
    
    node.members.forEach(member => {
      if (ts.isPropertySignature(member) && member.name) {
        const name = member.name.getText();
        const type = member.type ? member.type.getText() : 'any';
        const required = !member.questionToken;
        
        properties.push({ name, type, required });
      }
    });

    return {
      name: node.name.text,
      filePath,
      properties,
      category: this.categorizeType(node.name.text, filePath)
    };
  }

  private extractType(node: ts.TypeAliasDeclaration, filePath: string): TypeDefinition {
    return {
      name: node.name.text,
      filePath,
      category: this.categorizeType(node.name.text, filePath)
    };
  }

  private extractEnum(node: ts.EnumDeclaration, filePath: string): TypeDefinition {
    const properties: PropertyDefinition[] = [];
    
    node.members.forEach(member => {
      if (member.name) {
        const name = member.name.getText();
        const value = member.initializer ? member.initializer.getText() : '';
        properties.push({ 
          name, 
          type: 'enum_member', 
          required: true,
          description: value
        });
      }
    });

    return {
      name: node.name!.text,
      filePath,
      properties,
      category: 'utility'
    };
  }

  private categorizeType(name: string, filePath: string): 'database' | 'api' | 'component' | 'state' | 'utility' {
    const lowerPath = filePath.toLowerCase();
    const lowerName = name.toLowerCase();

    if (lowerPath.includes('database') || lowerPath.includes('db') || lowerPath.includes('models')) {
      return 'database';
    }
    if (lowerPath.includes('api') || lowerName.includes('request') || lowerName.includes('response')) {
      return 'api';
    }
    if (lowerPath.includes('component') || lowerName.includes('props')) {
      return 'component';
    }
    if (lowerPath.includes('state') || lowerPath.includes('store') || lowerName.includes('state')) {
      return 'state';
    }
    
    return 'utility';
  }
}