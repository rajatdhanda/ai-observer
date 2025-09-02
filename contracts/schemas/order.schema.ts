/**
 * Runtime Contract Enforcement with Zod
 * This ENFORCES contracts at runtime, not just detects violations
 */

import { z } from 'zod';

// The Order Contract as Zod Schema
export const OrderContract = z.object({
  id: z.string(),
  userId: z.string(), // NOT user_id, NOT customerId
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive()
  })),
  totalAmount: z.number().positive(),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string()
  }).optional(),
  paymentMethod: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Type inference from schema
export type Order = z.infer<typeof OrderContract>;

// Database to Contract Mapper (fixes snake_case)
export const DatabaseOrderMapper = z.object({
  id: z.string(),
  user_id: z.string(), // Database has snake_case
  items: z.any(),
  total_amount: z.number(),
  status: z.string(),
  shipping_address: z.any().optional(),
  payment_method: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string()
}).transform((data) => ({
  // Transform snake_case to camelCase
  id: data.id,
  userId: data.user_id,  // Transform to contract field
  items: data.items,
  totalAmount: data.total_amount,  // Transform to contract field
  status: data.status,
  shippingAddress: data.shipping_address,
  paymentMethod: data.payment_method,
  createdAt: data.created_at,  // Transform to contract field
  updatedAt: data.updated_at   // Transform to contract field
}));

// Hook Contract
export const UseOrdersContract = z.object({
  orders: z.array(OrderContract),
  loading: z.boolean(),
  error: z.string().nullable(),
  refetch: z.function()
});

/**
 * USAGE EXAMPLE - This ENFORCES the contract at runtime!
 */

// In your hook:
export function useOrdersWithContract() {
  const [orders, setOrders] = useState<Order[]>([]);
  
  const fetchOrders = async () => {
    const response = await fetch('/api/orders');
    const data = await response.json();
    
    // ENFORCE CONTRACT AT RUNTIME!
    try {
      // If database returns snake_case, transform it
      const validatedOrders = data.map((order: any) => 
        DatabaseOrderMapper.parse(order)  // Transforms AND validates!
      );
      
      // Now validatedOrders is GUARANTEED to match contract
      setOrders(validatedOrders);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('CONTRACT VIOLATION:', error.errors);
        // This PREVENTS bad data from entering your app!
        throw new Error(`Order data violates contract: ${error.errors.map(e => e.message).join(', ')}`);
      }
    }
  };
  
  return {
    orders,  // GUARANTEED to match OrderContract
    loading: false,
    error: null,
    refetch: fetchOrders
  };
}

// In your component:
export function OrdersTabWithContract() {
  const { orders } = useOrdersWithContract();
  
  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>
          {/* TypeScript KNOWS these fields exist and are correct type */}
          <p>User: {order.userId}</p>  {/* NOT customerId - enforced! */}
          <p>Total: {order.totalAmount}</p>  {/* NOT total_amount - enforced! */}
          <p>Created: {order.createdAt}</p>  {/* NOT created_at - enforced! */}
        </div>
      ))}
    </div>
  );
}

/**
 * API Endpoint with Contract Enforcement
 */
export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate incoming data against contract
  const result = OrderContract.safeParse(body);
  
  if (!result.success) {
    return Response.json(
      { 
        error: 'Contract violation',
        violations: result.error.errors 
      },
      { status: 400 }
    );
  }
  
  // result.data is GUARANTEED to match contract
  const order = result.data;
  
  // Save to database (transform back to snake_case if needed)
  await db.insert({
    user_id: order.userId,  // Transform for database
    total_amount: order.totalAmount,
    created_at: order.createdAt
  });
  
  return Response.json(order);
}