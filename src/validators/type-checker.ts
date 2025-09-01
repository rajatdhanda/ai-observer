import { Project, SourceFile, Node, SyntaxKind } from 'ts-morph';
import chalk from 'chalk';
import * as path from 'path';

export interface TypeIssue {
  file: string;
  line: number;
  column: number;
  type: 'new-interface' | 'new-type' | 'wrong-type';
  message: string;
  found?: string;
  expected?: string;
}

export class TypeChecker {
  private project: Project;
  private issues: TypeIssue[] = [];

  constructor() {
    this.project = new Project({
      skipAddingFilesFromTsConfig: true,
    });
  }

  checkFile(filePath: string): TypeIssue[] {
    this.issues = [];
    const sourceFile = this.project.addSourceFileAtPath(filePath);
    
    // Check for interface declarations
    const interfaces = sourceFile.getInterfaces();
    interfaces.forEach(interfaceDecl => {
      const pos = interfaceDecl.getStartLinePos();
      this.issues.push({
        file: filePath,
        line: interfaceDecl.getStartLineNumber(),
        column: pos,
        type: 'new-interface',
        message: `Found interface '${interfaceDecl.getName()}' - should import from schemas`,
        found: interfaceDecl.getName()
      });
    });

    // Check for type declarations
    const typeAliases = sourceFile.getTypeAliases();
    typeAliases.forEach(typeAlias => {
      const pos = typeAlias.getStartLinePos();
      this.issues.push({
        file: filePath,
        line: typeAlias.getStartLineNumber(),
        column: pos,
        type: 'new-type',
        message: `Found type '${typeAlias.getName()}' - should import from schemas`,
        found: typeAlias.getName()
      });
    });

    return this.issues;
  }

  printIssues(issues: TypeIssue[]) {
    if (issues.length === 0) {
      console.log(chalk.green('✅ No type issues found!'));
      return;
    }

    console.log(chalk.red(`\n❌ Found ${issues.length} issue(s):\n`));
    
    issues.forEach(issue => {
      console.log(chalk.yellow(`${issue.file}:${issue.line}:${issue.column}`));
      console.log(chalk.red(`  ${issue.message}`));
      if (issue.found) {
        console.log(chalk.gray(`  Found: ${issue.found}`));
      }
      if (issue.expected) {
        console.log(chalk.green(`  Expected: Import from schemas`));
      }
      console.log();
    });
  }
}