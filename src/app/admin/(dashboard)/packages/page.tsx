import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { packages } from "@/db/schema";
import { AdminPageTitle } from "@/components/admin/page-title";
import { CatalogManager } from "@/components/admin/catalog-manager";

export const dynamic = "force-dynamic";
export default async function AdminPackagesPage() { const items = await getDb().select().from(packages).orderBy(asc(packages.sortOrder)); return <><AdminPageTitle eyebrow="Package catalogue" title="Packages & pricing." copy="Manage public descriptions, starting rates, images and inclusions. Changes persist in PostgreSQL." /><CatalogManager kind="packages" items={items} /></>; }
