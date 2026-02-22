"use client";
import { ConfigEngine } from '@/components/Engines/ConfigEngine';
import nodeSchema from '@/schemas/node-config.json';

export default function NodeConfigPage() {
    return (
        <div>
            <h1 style={{ marginBottom: 24 }}>Node Configuration</h1>
            <ConfigEngine schema={nodeSchema as any} />
        </div>
    );
}
