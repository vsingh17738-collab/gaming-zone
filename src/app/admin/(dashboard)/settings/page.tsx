import { getBusinessSettings, integrationStatus } from "@/lib/data";
import { AdminPageTitle } from "@/components/admin/page-title";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";
export default async function AdminSettingsPage() { const settings = await getBusinessSettings(); return <><AdminPageTitle eyebrow="Business configuration" title="Settings that stay saved." copy="Public contact details, payment instructions, logo and quotation rules are stored in PostgreSQL." /><SettingsForm settings={settings} integrations={integrationStatus()} /></>; }
