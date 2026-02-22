"use client";
import { PageEngine } from '@/components/Engines/PageEngine';
import kpiSchemaV2 from '@/schemas/kpi-report-v2.json';

export default function KPIReportPage() {
    return <PageEngine schema={kpiSchemaV2 as any} />;
}
