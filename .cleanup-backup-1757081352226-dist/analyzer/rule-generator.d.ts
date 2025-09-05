import { TypeSystem, BusinessEntity, DataFlowMap, ValidationRule } from './index';
export declare class ValidationRuleGenerator {
    private ruleCounter;
    generate(types: TypeSystem, entities: BusinessEntity[], dataFlow: DataFlowMap): Promise<ValidationRule[]>;
    private generateTypeRules;
    private generateBusinessRules;
    private generateDataFlowRules;
    private generatePerformanceRules;
    private generateSecurityRules;
    private generateRuleId;
}
//# sourceMappingURL=rule-generator.d.ts.map