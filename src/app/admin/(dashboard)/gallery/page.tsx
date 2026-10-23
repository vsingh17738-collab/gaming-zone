import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { gallery } from "@/db/schema";
import { AdminPageTitle } from "@/components/admin/page-title";
import { GalleryManager } from "@/components/admin/gallery-manager";

export const dynamic = "force-dynamic";
export default async function AdminGalleryPage() { const items = await getDb().select().from(gallery).orderBy(asc(gallery.sortOrder)); return <><AdminPageTitle eyebrow="Portfolio" title="Gallery content." copy="Uploaded assets use persistent Blob storage; publication records are stored in PostgreSQL." /><GalleryManager items={items} /></>; }
