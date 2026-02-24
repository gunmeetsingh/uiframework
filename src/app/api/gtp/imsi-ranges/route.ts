import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

import { dbManager } from "@/core/db/manager";

// Mock data matching the user's table structure
let mockImsiRanges = [
    { imsirange_name: 'Range-001', from_imsi: '405800000000001', to_imsi: '405800000000999' },
    { imsirange_name: 'Range-002', from_imsi: '405810000000001', to_imsi: '405810000000999' }
];

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    // Auth Check
    if (!session || !(session.user as any).permissions.includes('gtp:imsi:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Try to use the database pool
    try {
        if (process.env.GTP_PROXY_DB_URL) {
            const pool = await dbManager.getPool('GTP_PROXY', process.env.GTP_PROXY_DB_URL);
            const [rows] = await pool.execute('SELECT * FROM gtp_imsi_ranges');
            return NextResponse.json(rows);
        }
    } catch (error) {
        console.error("Database Connection Failed (GET):", error);
        // Fallback to mock in dev, or return error in prod
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: "Database Connection Failed" }, { status: 500 });
        }
    }

    return NextResponse.json(mockImsiRanges);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    // Auth Check
    if (!session || !(session.user as any).permissions.includes('gtp:imsi:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await req.json();

    // Validation
    if (!data.imsirange_name || !data.from_imsi || !data.to_imsi) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Try to use the database pool
    try {
        if (process.env.GTP_PROXY_DB_URL) {
            const pool = await dbManager.getPool('GTP_PROXY', process.env.GTP_PROXY_DB_URL);
            await pool.execute(
                'INSERT INTO gtp_imsi_ranges (imsirange_name, from_imsi, to_imsi) VALUES (?, ?, ?)',
                [data.imsirange_name, data.from_imsi, data.to_imsi]
            );
            return NextResponse.json(data, { status: 201 });
        }
    } catch (error) {
        console.error("Database Save Failed (POST):", error);
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: "Database Save Failed" }, { status: 500 });
        }
    }

    mockImsiRanges.push(data);
    return NextResponse.json(data, { status: 201 });
}
