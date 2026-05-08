import { z } from "zod";

export const guestContactSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(40).optional().default(""),
  addressLine1: z.string().trim().min(1).max(300),
  addressLine2: z.string().trim().max(300).optional().default(""),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().max(120).optional().default(""),
  postalCode: z.string().trim().min(1).max(32),
  country: z.string().trim().min(1).max(120),
});

export type GuestContact = z.infer<typeof guestContactSchema>;
