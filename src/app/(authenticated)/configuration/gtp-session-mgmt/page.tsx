"use client";
import React from 'react';
import { ConfigEngine } from '@/components/Engines/ConfigEngine';
import gtpSessionSchema from '@/schemas/gtp-session-mgmt.json';
import { Guard } from '@/components/Access/Guard';

export default function GtpSessionMgmtPage() {
    return (
        <Guard permission="gtp:session:manage">
            <ConfigEngine
                schema={gtpSessionSchema as any}
            />
        </Guard>
    );
}
