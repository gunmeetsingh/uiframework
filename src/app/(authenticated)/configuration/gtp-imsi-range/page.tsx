"use client";
import React from 'react';
import { ConfigEngine } from '@/components/Engines/ConfigEngine';
import gtpImsiSchema from '@/schemas/gtp-imsi-range.json';
import { Guard } from '@/components/Access/Guard';

export default function GtpImsiRangePage() {
    return (
        <Guard permission="gtp:imsi:manage">
            <ConfigEngine
                schema={gtpImsiSchema as any}
            />
        </Guard>
    );
}
