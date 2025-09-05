import { TypeSystem } from './index';
export declare class TypeExtractor {
    extract(projectPath: string): Promise<TypeSystem>;
    private findTypeFiles;
    private extractFromFile;
    private extractInterface;
    private extractType;
    private extractEnum;
    private categorizeType;
}
//# sourceMappingURL=type-extractor.d.ts.map