import { z } from 'zod';

/**
 * Webhook Validation Schemas
 * MUST validate at every webhook boundary
 */

// Stripe Webhook
export const StripeWebhookSchema = z.object({
  id: z.string(),
  object: z.string(),
  api_version: z.string(),
  created: z.number(),
  data: z.object({
    object: z.record(z.unknown())
  }),
  livemode: z.boolean(),
  pending_webhooks: z.number(),
  request: z.object({
    id: z.string().nullable(),
    idempotency_key: z.string().nullable()
  }).nullable(),
  type: z.string()
});

export type StripeWebhook = z.infer<typeof StripeWebhookSchema>;

// PayPal Webhook
export const PayPalWebhookSchema = z.object({
  id: z.string(),
  event_version: z.string(),
  create_time: z.string(),
  resource_type: z.string(),
  event_type: z.string(),
  summary: z.string(),
  resource: z.record(z.unknown()),
  links: z.array(z.object({
    href: z.string(),
    rel: z.string(),
    method: z.string()
  }))
});

export type PayPalWebhook = z.infer<typeof PayPalWebhookSchema>;

// GitHub Webhook
export const GitHubWebhookSchema = z.object({
  action: z.string().optional(),
  repository: z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    owner: z.object({
      login: z.string(),
      id: z.number()
    })
  }),
  sender: z.object({
    login: z.string(),
    id: z.number(),
    type: z.string()
  })
});

export type GitHubWebhook = z.infer<typeof GitHubWebhookSchema>;

// Slack Webhook
export const SlackWebhookSchema = z.object({
  type: z.string(),
  token: z.string().optional(),
  team_id: z.string().optional(),
  team_domain: z.string().optional(),
  channel_id: z.string().optional(),
  channel_name: z.string().optional(),
  user_id: z.string().optional(),
  user_name: z.string().optional(),
  command: z.string().optional(),
  text: z.string().optional(),
  response_url: z.string().optional(),
  trigger_id: z.string().optional()
});

export type SlackWebhook = z.infer<typeof SlackWebhookSchema>;

// Generic Webhook (fallback)
export const GenericWebhookSchema = z.object({
  event: z.string(),
  timestamp: z.union([z.string(), z.number()]),
  data: z.record(z.unknown())
});

export type GenericWebhook = z.infer<typeof GenericWebhookSchema>;

/**
 * Webhook validation function
 * ALWAYS use this at webhook boundaries
 */
export function validateWebhook(
  payload: unknown,
  provider: 'stripe' | 'paypal' | 'github' | 'slack' | 'generic' = 'generic'
) {
  const schemas = {
    stripe: StripeWebhookSchema,
    paypal: PayPalWebhookSchema,
    github: GitHubWebhookSchema,
    slack: SlackWebhookSchema,
    generic: GenericWebhookSchema
  };
  
  const schema = schemas[provider];
  
  try {
    return schema.parse(payload); // Fails loudly on mismatch
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`Webhook validation failed for ${provider}:`, error.errors);
      throw new Error(`Invalid ${provider} webhook payload: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Webhook handler with built-in validation
 */
export function createWebhookHandler<T>(
  schema: z.ZodSchema<T>,
  handler: (validated: T) => Promise<void>
) {
  return async (rawPayload: unknown) => {
    // ALWAYS validate first
    const validated = schema.parse(rawPayload);
    
    // Then handle with validated data
    return handler(validated);
  };
}

// Example usage:
/*
app.post('/webhook/stripe', async (req, res) => {
  try {
    // MUST validate at boundary
    const validated = validateWebhook(req.body, 'stripe');
    
    // Now safe to use validated data
    await processStripeWebhook(validated);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook validation failed:', error);
    res.status(400).send('Invalid webhook payload');
  }
});
*/