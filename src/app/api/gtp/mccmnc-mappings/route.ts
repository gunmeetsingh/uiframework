import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbManager } from "@/core/db/manager";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).permissions.includes('gtp:mapping:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        if (process.env.GTP_PROXY_DB_URL) {
            const pool = await dbManager.getPool('GTP_PROXY', process.env.GTP_PROXY_DB_URL);
            const [rows] = await pool.execute('SELECT * FROM gtp_mccmnc_mappings');
            return NextResponse.json(rows);
        }
    } catch (error) {
        console.error("Database Connection Failed (Mappings GET):", error);
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: "Database Connection Failed" }, { status: 500 });
        }
    }

    return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).permissions.includes('gtp:mapping:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await req.json();

    try {
        if (process.env.GTP_PROXY_DB_URL) {
            const pool = await dbManager.getPool('GTP_PROXY', process.env.GTP_PROXY_DB_URL);
            await pool.execute(
                'INSERT INTO gtp_mccmnc_mappings (network_name, mcc, mnc, mnc_touse_for_handling) VALUES (?, ?, ?, ?)',
                [data.network_name, data.mcc, data.mnc, data.mnc_touse_for_handling]
            );
            return NextResponse.json(data, { status: 201 });
        }
    } catch (error) {
        console.error("Database Save Failed (Mappings POST):", error);
        return NextResponse.json({ error: "Database Save Failed" }, { status: 500 });
    }

    return NextResponse.json({ error: "DB URL Not Configured" }, { status: 500 });
}
