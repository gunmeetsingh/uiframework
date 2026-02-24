"use client";
import React from 'react';
import { ConfigEngine } from '@/components/Engines/ConfigEngine';
import gtpMappingSchema from '@/schemas/gtp-mccmnc-mapping.json';
import { Guard } from '@/components/Access/Guard';

export default function GtpMccMncMappingPage() {
    return (
        <Guard permission="gtp:mapping:manage">
            <ConfigEngine
                schema={gtpMappingSchema as any}
            />
        </Guard>
    );
}
