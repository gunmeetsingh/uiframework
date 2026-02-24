"use client";
import React from 'react';
import { ConfigEngine } from '@/components/Engines/ConfigEngine';
import schema from '@/schemas/audit-trail.json';
import { Guard } from '@/components/Access/Guard';

export default function AuditTrailPage() {
    // Audit Trail is restricted to admins
    return (
        <Guard permission="user:manage">
            <div style={{ padding: '24px' }}>
                <ConfigEngine
                    schema={{
                        ...schema,
                        endpoint: '/api/admin/audit-trail',
                        // Disable buttons in Audit Trail list
                        permissions: {
                            create: 'disabled',
                            update: 'disabled',
                            delete: 'disabled'
                        }
                    }}
                />
            </div>
        </Guard>
    );
}
