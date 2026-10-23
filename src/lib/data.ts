import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";
import { businessSettings, gallery, packages, reviews, services, users } from "@/db/schema";
import { defaultPackages, defaultServices, defaultSettings, inspirationGallery } from "./content";

export async function getBusinessSettings() {
  if (!isDatabaseConfigured()) return defaultSettings;
  const rows = await getDb().select().from(businessSettings).where(eq(businessSettings.id, 1)).limit(1);
  return rows[0] ?? defaultSettings;
}

export async function getPublicServices() {
  if (!isDatabaseConfigured()) return defaultServices;
  return getDb().select().from(services).where(eq(services.isActive, true)).orderBy(asc(services.sortOrder), asc(services.name));
}

export async function getPublicPackages() {
  if (!isDatabaseConfigured()) return defaultPackages;
  return getDb().select().from(packages).where(eq(packages.isActive, true)).orderBy(asc(packages.sortOrder), asc(packages.name));
}

export async function getPublicGallery() {
  if (!isDatabaseConfigured()) return inspirationGallery;
  return getDb().select().from(gallery).where(eq(gallery.isPublished, true)).orderBy(asc(gallery.sortOrder), desc(gallery.createdAt));
}

export async function getApprovedReviews() {
  if (!isDatabaseConfigured()) return [];
  return getDb().select({
    id: reviews.id,
    rating: reviews.rating,
    comment: reviews.comment,
    createdAt: reviews.createdAt,
    customerName: users.name,
  }).from(reviews).innerJoin(users, eq(users.id, reviews.customerId))
    .where(eq(reviews.isApproved, true))
    .orderBy(desc(reviews.createdAt)).limit(12);
}

export async function getBookingOptions() {
  const [settings, packageList, serviceList] = await Promise.all([
    getBusinessSettings(),
    getPublicPackages(),
    getPublicServices(),
  ]);
  return { settings, packages: packageList, services: serviceList };
}

export function integrationStatus() {
  return {
    database: isDatabaseConfigured(),
    uploads: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
    webhook: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    email: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
    whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    sms: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
  };
}

export async function getPublishedGalleryByCategory(category?: string) {
  if (!category) return getPublicGallery();
  if (!isDatabaseConfigured()) return inspirationGallery.filter((item) => item.category === category);
  return getDb().select().from(gallery).where(and(eq(gallery.isPublished, true), eq(gallery.category, category))).orderBy(asc(gallery.sortOrder));
}
