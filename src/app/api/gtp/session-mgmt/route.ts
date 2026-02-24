import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbManager } from "@/core/db/manager";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).permissions.includes('gtp:session:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        if (process.env.GTP_PROXY_DB_URL) {
            const pool = await dbManager.getPool('GTP_PROXY', process.env.GTP_PROXY_DB_URL);
            const [rows] = await pool.execute('SELECT * FROM gtp_session_mgmt');
            return NextResponse.json(rows);
        }
    } catch (error) {
        console.error("Database Connection Failed (Session GET):", error);
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: "Database Connection Failed" }, { status: 500 });
        }
    }

    return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).permissions.includes('gtp:session:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await req.json();

    try {
        if (process.env.GTP_PROXY_DB_URL) {
            const pool = await dbManager.getPool('GTP_PROXY', process.env.GTP_PROXY_DB_URL);
            await pool.execute(
                'INSERT INTO gtp_session_mgmt (home_nw_mccmnc, visited_nw_mcc, visited_nw_mccmnc, apn, session_handling, gtp_user_bypass, mapped_apn, pgw_ips, imsirange_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    data.home_nw_mccmnc,
                    data.visited_nw_mcc,
                    data.visited_nw_mccmnc,
                    data.apn,
                    data.session_handling,
                    data.gtp_user_bypass,
                    data.mapped_apn,
                    data.pgw_ips,
                    data.imsirange_name
                ]
            );
            return NextResponse.json(data, { status: 201 });
        }
    } catch (error) {
        console.error("Database Save Failed (Session POST):", error);
        return NextResponse.json({ error: "Database Save Failed" }, { status: 500 });
    }

    return NextResponse.json({ error: "DB URL Not Configured" }, { status: 500 });
}
