import { z } from 'zod';

/**
 * Message Queue Validation Schemas
 * MUST validate at every queue boundary (send/receive)
 */

// Email Queue Message
export const EmailQueueMessageSchema = z.object({
  id: z.string().uuid(),
  to: z.string().email(),
  from: z.string().email(),
  subject: z.string().min(1),
  body: z.string(),
  html: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    contentType: z.string()
  })).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  createdAt: z.string().datetime(),
  scheduledFor: z.string().datetime().optional()
});

export type EmailQueueMessage = z.infer<typeof EmailQueueMessageSchema>;

// Job Queue Message
export const JobQueueMessageSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  payload: z.record(z.unknown()),
  priority: z.number().min(0).max(10).default(5),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  createdAt: z.string().datetime(),
  startAfter: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  failedAt: z.string().datetime().optional(),
  error: z.string().optional()
});

export type JobQueueMessage = z.infer<typeof JobQueueMessageSchema>;

// Notification Queue Message
export const NotificationQueueSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  type: z.enum(['email', 'sms', 'push', 'in-app']),
  channel: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.unknown()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  expiresAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  readAt: z.string().datetime().optional(),
  createdAt: z.string().datetime()
});

export type NotificationQueue = z.infer<typeof NotificationQueueSchema>;

// Analytics Event Queue
export const AnalyticsEventSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().optional(),
  sessionId: z.string(),
  eventType: z.string(),
  eventName: z.string(),
  properties: z.record(z.unknown()),
  timestamp: z.string().datetime(),
  context: z.object({
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    referrer: z.string().optional(),
    page: z.string().optional()
  }).optional()
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// Order Processing Queue
export const OrderProcessingQueueSchema = z.object({
  orderId: z.string(),
  action: z.enum(['validate', 'charge', 'fulfill', 'ship', 'complete', 'cancel']),
  customerId: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive()
  })),
  metadata: z.record(z.unknown()).optional(),
  idempotencyKey: z.string(),
  timestamp: z.string().datetime()
});

export type OrderProcessingQueue = z.infer<typeof OrderProcessingQueueSchema>;

/**
 * Queue Message Wrapper (for SQS, RabbitMQ, etc.)
 */
export const QueueMessageWrapperSchema = z.object({
  messageId: z.string(),
  receiptHandle: z.string().optional(),
  body: z.string(), // Will be parsed separately
  attributes: z.record(z.string()).optional(),
  messageAttributes: z.record(z.unknown()).optional(),
  md5OfBody: z.string().optional(),
  eventSource: z.string().optional(),
  eventSourceARN: z.string().optional(),
  awsRegion: z.string().optional()
});

/**
 * Queue validation function
 * ALWAYS use this at queue boundaries
 */
export function validateQueueMessage<T>(
  message: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    // If it's a wrapped message (like SQS), unwrap first
    if (typeof message === 'object' && message !== null && 'body' in message) {
      const wrapper = QueueMessageWrapperSchema.parse(message);
      const body = typeof wrapper.body === 'string' 
        ? JSON.parse(wrapper.body) 
        : wrapper.body;
      return schema.parse(body);
    }
    
    // Direct message
    return schema.parse(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Queue message validation failed:', error.errors);
      throw new Error(`Invalid queue message: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Queue sender with built-in validation
 */
export function createQueueSender<T>(
  schema: z.ZodSchema<T>,
  sendFn: (validated: T) => Promise<void>
) {
  return async (message: T) => {
    // ALWAYS validate before sending
    const validated = schema.parse(message);
    return sendFn(validated);
  };
}

/**
 * Queue consumer with built-in validation
 */
export function createQueueConsumer<T>(
  schema: z.ZodSchema<T>,
  handler: (validated: T) => Promise<void>
) {
  return async (rawMessage: unknown) => {
    // ALWAYS validate on receive
    const validated = validateQueueMessage(rawMessage, schema);
    return handler(validated);
  };
}

// Example usage:
/*
// Sending to queue
const sendEmail = createQueueSender(
  EmailQueueMessageSchema,
  async (email) => {
    await sqs.sendMessage({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(email)
    }).promise();
  }
);

// Consuming from queue
const processEmail = createQueueConsumer(
  EmailQueueMessageSchema,
  async (email) => {
    // email is guaranteed to be valid
    await sendEmailViaProvider(email);
  }
);

// Usage
await sendEmail({
  id: uuid(),
  to: 'user@example.com',
  from: 'noreply@app.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up',
  priority: 'high',
  createdAt: new Date().toISOString()
});
*/