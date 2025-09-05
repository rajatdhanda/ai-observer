import { DataFlowMap, TypeSystem } from './index';
export declare class DataFlowMapper {
    map(projectPath: string, types: TypeSystem): Promise<DataFlowMap>;
    private identifyLayers;
    private findApiRoutes;
    private walkApiDir;
    private extractRouteName;
    private findStateManagement;
    private findUIComponents;
    private getComponentNames;
    private getPageComponents;
    private findConnections;
    private identifyCriticalPaths;
    private hasAuthComponents;
}
//# sourceMappingURL=data-flow-mapper.d.ts.map