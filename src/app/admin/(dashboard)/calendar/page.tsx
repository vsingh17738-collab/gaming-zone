import { AdminPageTitle } from "@/components/admin/page-title";
import { AdminCalendar } from "@/components/admin/admin-calendar";
import { todayInIndia } from "@/lib/dates";

export default function AdminCalendarPage() { return <><AdminPageTitle eyebrow="Availability" title="Event calendar." copy="Detailed event and customer information is restricted to authenticated administrators." /><AdminCalendar initialMonth={todayInIndia().slice(0, 7)} /></>; }
