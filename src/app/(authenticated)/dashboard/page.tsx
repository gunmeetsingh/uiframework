"use client";
import { PageEngine } from '@/components/Engines/PageEngine';
import dashboardSchema from '@/schemas/dashboard-config.json';

export default function DashboardPage() {
    return <PageEngine schema={dashboardSchema as any} />;
}
