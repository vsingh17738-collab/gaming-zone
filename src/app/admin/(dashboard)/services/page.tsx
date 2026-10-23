import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { services } from "@/db/schema";
import { AdminPageTitle } from "@/components/admin/page-title";
import { CatalogManager } from "@/components/admin/catalog-manager";

export const dynamic = "force-dynamic";
export default async function AdminServicesPage() { const items = await getDb().select().from(services).orderBy(asc(services.sortOrder)); return <><AdminPageTitle eyebrow="Service catalogue" title="Services & extras." copy="Active rates are used by the server for every new quotation. Existing bookings keep their price snapshots." /><CatalogManager kind="services" items={items} /></>; }
