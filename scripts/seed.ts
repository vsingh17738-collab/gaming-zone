import { getDb } from "../src/db";
import { businessSettings, packages, services, users } from "../src/db/schema";
import { defaultServices, defaultPackages, defaultSettings, inspirationGallery } from "../src/lib/content";
import { eq } from "drizzle-orm";

async function seed() {
  const db = getDb();
  await db.insert(businessSettings).values(defaultSettings).onConflictDoNothing({ target: businessSettings.id });
  await db.insert(services).values(defaultServices.map((service) => ({
    slug: service.slug, name: service.name, description: service.description, category: service.category,
    imageUrl: service.imageUrl, unitLabel: service.unitLabel, priceInPaise: service.priceInPaise,
    isActive: service.isActive, sortOrder: service.sortOrder,
  }))).onConflictDoNothing({ target: services.slug });
  await db.insert(packages).values((defaultPackages.map((item) => ({
    slug: item.slug, name: item.name, description: item.description, imageUrl: item.imageUrl,
    priceInPaise: item.priceInPaise, inclusions: item.inclusions, isActive: item.isActive,
    isFeatured: item.isFeatured, sortOrder: item.sortOrder,
  })))).onConflictDoNothing({ target: packages.slug });
  // Stock/generative inspiration is not seeded as business portfolio work. Admins upload real event photos.
  void inspirationGallery;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  await db.transaction(async (tx) => {
    for (const email of adminEmails) {
      const promoted = await tx.update(users).set({ role: "admin", updatedAt: new Date() }).where(eq(users.email, email)).returning({ id: users.id });
      if (!promoted[0]) {
        throw new Error("Administrator promotion aborted: every ADMIN_EMAILS entry must belong to an already registered account");
      }
    }
  });
  console.log(`Seed complete: settings, ${defaultServices.length} services, ${defaultPackages.length} packages. ${adminEmails.length} existing account(s) promoted to admin.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed", error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
