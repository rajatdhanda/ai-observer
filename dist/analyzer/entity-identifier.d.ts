import { TypeSystem, DataFlowMap, BusinessEntity } from './index';
export declare class EntityIdentifier {
    identify(types: TypeSystem, dataFlow: DataFlowMap): Promise<BusinessEntity[]>;
    private looksLikeEntity;
    private createEntity;
    private determineEntityType;
    private normalizeType;
    private establishRelationships;
    private extractEntityFromForeignKey;
    private extractEntityFromArrayType;
    private identifyOperations;
}
//# sourceMappingURL=entity-identifier.d.ts.map