import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["customer", "admin"]);
export const bookingStatus = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rejected",
]);
export const paymentStatus = pgEnum("payment_status", [
  "unpaid",
  "partially_paid",
  "paid",
  "refunded",
]);
export const timeSlot = pgEnum("time_slot", ["morning", "evening", "full_day"]);
export const reservedSlot = pgEnum("reserved_slot", ["morning", "evening"]);
export const quotationStatus = pgEnum("quotation_status", [
  "sent",
  "accepted",
  "expired",
  "rejected",
]);
export const paymentMethod = pgEnum("payment_method", ["razorpay", "manual"]);
export const paymentKind = pgEnum("payment_kind", ["advance", "balance"]);
export const paymentRecordStatus = pgEnum("payment_record_status", [
  "created",
  "proof_submitted",
  "paid",
  "failed",
  "rejected",
  "refunded",
]);
export const notificationChannel = pgEnum("notification_channel", [
  "email",
  "sms",
  "whatsapp",
]);
export const notificationStatus = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
  "not_configured",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").default("customer").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(sql`lower(${table.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 140 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 60 }).notNull(),
    imageUrl: text("image_url"),
    unitLabel: varchar("unit_label", { length: 60 }).default("event").notNull(),
    priceInPaise: integer("price_in_paise").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    check("services_price_nonnegative", sql`${table.priceInPaise} >= 0`),
    index("services_active_sort_idx").on(table.isActive, table.sortOrder),
  ],
);

export const packages = pgTable(
  "packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 140 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url"),
    priceInPaise: integer("price_in_paise").default(0).notNull(),
    inclusions: jsonb("inclusions").$type<string[]>().default([]).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    check("packages_price_nonnegative", sql`${table.priceInPaise} >= 0`),
    index("packages_active_sort_idx").on(table.isActive, table.sortOrder),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingNumber: varchar("booking_number", { length: 32 }).notNull().unique(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    packageId: uuid("package_id").references(() => packages.id, { onDelete: "restrict" }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    eventDate: date("event_date").notNull(),
    eventTime: varchar("event_time", { length: 5 }).notNull(),
    timeSlot: timeSlot("time_slot").notNull(),
    location: text("location").notNull(),
    guestCount: integer("guest_count").notNull(),
    status: bookingStatus("status").default("pending").notNull(),
    paymentStatus: paymentStatus("payment_status").default("unpaid").notNull(),
    subtotalInPaise: integer("subtotal_in_paise").notNull(),
    discountInPaise: integer("discount_in_paise").default(0).notNull(),
    taxInPaise: integer("tax_in_paise").default(0).notNull(),
    totalInPaise: integer("total_in_paise").notNull(),
    advanceInPaise: integer("advance_in_paise").notNull(),
    decorationRequirements: text("decoration_requirements"),
    waterSupply: boolean("water_supply").default(false).notNull(),
    additionalNotes: text("additional_notes"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    ...timestamps,
  },
  (table) => [
    check("bookings_guest_count_positive", sql`${table.guestCount} > 0`),
    check("bookings_money_nonnegative", sql`${table.subtotalInPaise} >= 0 AND ${table.discountInPaise} >= 0 AND ${table.taxInPaise} >= 0 AND ${table.totalInPaise} >= 0 AND ${table.advanceInPaise} >= 0`),
    index("bookings_customer_idx").on(table.customerId, table.createdAt),
    index("bookings_status_date_idx").on(table.status, table.eventDate),
    index("bookings_event_date_idx").on(table.eventDate),
  ],
);

// One row per reservable half-day. The unique constraint is the final race-safe
// guard: full-day bookings insert both rows in the same transaction.
export const bookingSlots = pgTable(
  "booking_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    eventDate: date("event_date").notNull(),
    slot: reservedSlot("slot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("booking_slots_date_slot_unique").on(table.eventDate, table.slot),
    index("booking_slots_booking_idx").on(table.bookingId),
    index("booking_slots_date_idx").on(table.eventDate),
  ],
);

export const bookingItems = pgTable(
  "booking_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    serviceName: varchar("service_name", { length: 160 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceInPaise: integer("unit_price_in_paise").notNull(),
    totalInPaise: integer("total_in_paise").notNull(),
  },
  (table) => [
    check("booking_items_quantity_positive", sql`${table.quantity} > 0`),
    check("booking_items_money_nonnegative", sql`${table.unitPriceInPaise} >= 0 AND ${table.totalInPaise} >= 0`),
    index("booking_items_booking_idx").on(table.bookingId),
  ],
);

export const quotations = pgTable(
  "quotations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quotationNumber: varchar("quotation_number", { length: 32 }).notNull().unique(),
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: quotationStatus("status").default("sent").notNull(),
    subtotalInPaise: integer("subtotal_in_paise").notNull(),
    discountInPaise: integer("discount_in_paise").default(0).notNull(),
    taxInPaise: integer("tax_in_paise").default(0).notNull(),
    totalInPaise: integer("total_in_paise").notNull(),
    advanceInPaise: integer("advance_in_paise").notNull(),
    validUntil: date("valid_until").notNull(),
    terms: text("terms").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("quotations_customer_idx").on(table.customerId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    paymentNumber: varchar("payment_number", { length: 32 }).notNull().unique(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    method: paymentMethod("method").notNull(),
    kind: paymentKind("kind").notNull(),
    amountInPaise: integer("amount_in_paise").notNull(),
    status: paymentRecordStatus("status").default("created").notNull(),
    providerOrderId: varchar("provider_order_id", { length: 100 }),
    providerPaymentId: varchar("provider_payment_id", { length: 100 }),
    proofUrl: text("proof_url"),
    proofPathname: text("proof_pathname"),
    proofContentType: varchar("proof_content_type", { length: 100 }),
    proofUploadedAt: timestamp("proof_uploaded_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "restrict" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("payments_provider_order_unique").on(table.providerOrderId),
    uniqueIndex("payments_provider_payment_unique").on(table.providerPaymentId),
    uniqueIndex("payments_active_razorpay_order_unique").on(table.bookingId, table.kind).where(sql`${table.method} = 'razorpay' AND ${table.status} = 'created'`),
    uniqueIndex("payments_pending_manual_proof_unique").on(table.bookingId, table.kind).where(sql`${table.method} = 'manual' AND ${table.status} = 'proof_submitted'`),
    check("payments_amount_positive", sql`${table.amountInPaise} > 0`),
    index("payments_booking_idx").on(table.bookingId, table.createdAt),
    index("payments_status_idx").on(table.status),
  ],
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceNumber: varchar("invoice_number", { length: 32 }).notNull().unique(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    paymentId: uuid("payment_id")
      .notNull()
      .unique()
      .references(() => payments.id, { onDelete: "restrict" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    amountInPaise: integer("amount_in_paise").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("invoices_amount_positive", sql`${table.amountInPaise} > 0`),
    index("invoices_booking_idx").on(table.bookingId),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    isApproved: boolean("is_approved").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("reviews_rating_range", sql`${table.rating} BETWEEN 1 AND 5`),
    index("reviews_approved_idx").on(table.isApproved, table.createdAt),
  ],
);

export const gallery = pgTable(
  "gallery",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 160 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    imageUrl: text("image_url").notNull(),
    altText: varchar("alt_text", { length: 240 }).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("gallery_published_sort_idx").on(table.isPublished, table.sortOrder)],
);

export const businessSettings = pgTable("business_settings", {
  id: integer("id").default(1).primaryKey(),
  businessName: varchar("business_name", { length: 160 }).notNull(),
  contactPerson: varchar("contact_person", { length: 120 }).notNull(),
  address: text("address").notNull(),
  serviceArea: text("service_area").notNull(),
  phone: varchar("phone", { length: 20 }),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  email: varchar("email", { length: 255 }),
  instagramUrl: text("instagram_url"),
  mapUrl: text("map_url"),
  logoUrl: text("logo_url"),
  paymentQrUrl: text("payment_qr_url"),
  paymentInstructions: text("payment_instructions"),
  upiId: varchar("upi_id", { length: 120 }),
  bankDetails: text("bank_details"),
  taxDetails: text("tax_details"),
  quotationTerms: text("quotation_terms").notNull(),
  advancePercent: integer("advance_percent").default(30).notNull(),
  taxBasisPoints: integer("tax_basis_points").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("settings_id_singleton", sql`${table.id} = 1`),
  check("settings_advance_range", sql`${table.advancePercent} BETWEEN 0 AND 100`),
  check("settings_tax_range", sql`${table.taxBasisPoints} BETWEEN 0 AND 10000`),
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    channel: notificationChannel("channel").notNull(),
    recipient: varchar("recipient", { length: 255 }).notNull(),
    template: varchar("template", { length: 100 }).notNull(),
    status: notificationStatus("status").default("pending").notNull(),
    providerMessageId: varchar("provider_message_id", { length: 160 }),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("notifications_booking_idx").on(table.bookingId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("audit_logs_entity_idx").on(table.entityType, table.entityId)],
);

export const rateLimits = pgTable("rate_limits", {
  key: varchar("key", { length: 64 }).notNull(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
  count: integer("count").default(1).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [
  uniqueIndex("rate_limits_key_window_unique").on(table.key, table.windowStartedAt),
  index("rate_limits_expiry_idx").on(table.expiresAt),
]);

export type User = typeof users.$inferSelect;
export type SafeUser = Pick<User, "id" | "email" | "name" | "phone" | "role">;
export type Service = typeof services.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type BusinessSettings = typeof businessSettings.$inferSelect;
export type GalleryItem = typeof gallery.$inferSelect;
