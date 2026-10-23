import { z } from "zod";
import { isValidDateString, todayInIndia } from "./dates";

const phone = z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,17}$/, "Enter a valid phone number").max(20);
const httpUrl = z.string().trim().max(1000).refine((value) => {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}, "Enter a valid HTTP(S) URL");
const storedImageUrl = z.string().trim().max(1000).refine((value) => {
  if (value.startsWith("/images/")) return true;
  try { return new URL(value).protocol === "https:" && new URL(value).hostname.endsWith(".blob.vercel-storage.com"); } catch { return false; }
}, "Use a local /images path or a Vercel Blob HTTPS URL");
const optionalUrl = z.union([z.literal(""), httpUrl]).optional();
const optionalImageUrl = z.union([z.literal(""), storedImageUrl]).optional();
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  phone,
  password: z.string().min(12, "Use at least 12 characters").max(72).refine((value) => new TextEncoder().encode(value).byteLength <= 72, "Password must not exceed 72 UTF-8 bytes").regex(/[A-Za-z]/, "Include a letter").regex(/[0-9]/, "Include a number"),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(72),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone,
});

export const serviceSelectionSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
});

export const bookingSchema = z.object({
  eventType: z.string().trim().min(2).max(100),
  eventDate: z.string().refine(isValidDateString, "Enter a valid event date").refine((value) => value >= todayInIndia(), "Past event dates cannot be booked"),
  eventTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid event time"),
  timeSlot: z.enum(["morning", "evening", "full_day"]),
  location: z.string().trim().min(5).max(500),
  guestCount: z.number().int().min(1).max(10_000),
  packageId: z.string().uuid(),
  serviceItems: z.array(serviceSelectionSchema).max(20).default([]),
  waterSupply: z.boolean().default(false),
  decorationRequirements: optionalText(2000),
  additionalNotes: optionalText(2000),
});

export const quotePreviewSchema = bookingSchema.pick({
  packageId: true,
  serviceItems: true,
  waterSupply: true,
});

export const availabilitySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  slot: z.enum(["morning", "evening", "full_day"]).optional(),
});

export const bookingStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "rejected"]),
  reason: z.string().trim().max(1000).optional(),
});

export const serviceAdminSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(140),
  description: z.string().trim().min(10).max(3000),
  category: z.string().trim().min(2).max(60),
  imageUrl: optionalImageUrl,
  unitLabel: z.string().trim().min(1).max(60).default("event"),
  priceInPaise: z.number().int().min(0).max(2_000_000_000),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const packageAdminSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(140),
  description: z.string().trim().min(10).max(3000),
  imageUrl: optionalImageUrl,
  priceInPaise: z.number().int().min(0).max(2_000_000_000),
  inclusions: z.array(z.string().trim().min(1).max(300)).max(30),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const settingsSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  contactPerson: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(1000),
  serviceArea: z.string().trim().min(2).max(500),
  phone: z.union([z.literal(""), phone]).optional(),
  whatsappNumber: z.union([z.literal(""), phone]).optional(),
  email: z.union([z.literal(""), z.string().trim().email().max(255)]).optional(),
  instagramUrl: optionalUrl,
  mapUrl: optionalUrl,
  logoUrl: optionalImageUrl,
  paymentQrUrl: optionalImageUrl,
  paymentInstructions: optionalText(3000),
  upiId: z.string().trim().max(120).optional(),
  bankDetails: optionalText(3000),
  taxDetails: optionalText(2000),
  quotationTerms: z.string().trim().min(10).max(5000),
  advancePercent: z.number().int().min(0).max(100),
  taxBasisPoints: z.number().int().min(0).max(10_000),
});

export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1500),
});

export const paymentProofSchema = z.object({
  bookingId: z.string().uuid(),
  kind: z.enum(["advance", "balance"]),
});

export const paymentReviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().max(1000).optional(),
});

export const galleryAdminSchema = z.object({
  title: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(80),
  imageUrl: storedImageUrl,
  altText: z.string().trim().min(5).max(240),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  isPublished: z.boolean().default(true),
});
