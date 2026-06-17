/**
 * Zod validation schemas for Paytm payment APIs.
 */

import { z } from "zod";

export const createOrderSchema = z.object({
  showtimeId: z.string().uuid("Invalid showtime ID"),
  selectedSeats: z
    .array(z.string().regex(/^[A-Z]-\d{1,2}$/, "Invalid seat format"))
    .min(1, "Select at least one seat")
    .max(10, "Maximum 10 seats per booking"),
  customerName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .trim(),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  subtotal: z.number().positive("Invalid subtotal"),
  discount: z.number().min(0, "Invalid discount"),
  finalAmount: z.number().positive("Invalid amount"),
  promoCode: z.string().optional(),
});

export const verifyOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID required").max(50),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyOrderInput = z.infer<typeof verifyOrderSchema>;
