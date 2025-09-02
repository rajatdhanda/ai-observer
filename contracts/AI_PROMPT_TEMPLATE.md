# AI Prompt Template for Contract-Compliant Code Generation

## How to Use This Template

1. Copy the relevant contract definitions from `contracts.yaml`
2. Include them in your AI prompt
3. The AI will generate code that follows these contracts

---

## Template for New Feature Development

```markdown
I need to implement [FEATURE_NAME] for my application.

IMPORTANT CONTRACT REQUIREMENTS:
Please follow these field naming contracts exactly:

[PASTE RELEVANT CONTRACTS FROM contracts.yaml HERE]

For example, if working with Orders:
- Use `userId` NOT `user_id` or `customerId`
- Use `totalAmount` NOT `total_amount` or `amount`
- Use `createdAt` NOT `created_at` or `created`
- Use camelCase for ALL field names

REQUIREMENTS:
1. [Your specific requirements]
2. [Additional requirements]

Please ensure:
- All field names match the contract exactly
- Use TypeScript types that match the contract
- Database queries map snake_case to camelCase if needed
- Hooks return the contract shape
- Components use only contract field names
```

---

## Template for Fixing Existing Code

```markdown
I need to fix contract violations in my code.

Current violations:
[PASTE VIOLATIONS FROM npm run validate-contracts]

Correct contract:
[PASTE CONTRACT FROM contracts.yaml]

Please:
1. Update all instances to use the correct field names
2. Ensure type consistency across all layers
3. Add type annotations where missing
```

---

## Example Prompt with Contract

```markdown
Create a useOrders hook for my application.

CONTRACT TO FOLLOW:
```yaml
Order:
  schema:
    id: string
    userId: string        # NOT user_id or customerId
    items: OrderItem[]
    totalAmount: number   # NOT total_amount
    status: string
    createdAt: string    # NOT created_at
```

The hook should:
1. Fetch orders from the database
2. Return loading and error states
3. Include a refetch function

IMPORTANT: Use exactly the field names from the contract above.
```

---

## Common Mistakes to Avoid

❌ DON'T let AI create its own field names
✅ DO provide the contract upfront

❌ DON'T assume AI remembers contracts between prompts
✅ DO include contracts in every prompt

❌ DON'T use different naming in different layers
✅ DO use consistent contract fields everywhere

---

## Validation Command

After generating code, always validate:
```bash
npm run validate-contracts
```

Only accept code with > 80% compliance score.