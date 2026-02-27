import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbManager } from "@/core/db/manager";
import schema from "@/schemas/audit-trail.json";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    // Auth Check - Only admins can see audit trail
    if (!session || !(session.user as any).permissions.includes('user:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const connectionString = process.env.CORE_DB_URL;
        if (connectionString) {
            const { searchParams } = new URL(req.url);
            const from = searchParams.get('from');
            const to = searchParams.get('to');

            const pool = await dbManager.getPool('CORE', connectionString);

            let query = `SELECT * FROM audit_logs`;
            const params: any[] = [];
            const conditions: string[] = [];

            if (from) {
                conditions.push(`timestamp >= ?`);
                params.push(from);
            }
            if (to) {
                conditions.push(`timestamp <= ?`);
                params.push(to);
            }

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }

            query += ` ORDER BY timestamp DESC`;

            const [rows] = await pool.execute(query, params);
            return NextResponse.json(rows);
        }
    } catch (error) {
        console.error("Database Connection Failed (Audit Logs):", error);
        return NextResponse.json({ error: "Database Connection Failed" }, { status: 500 });
    }

    return NextResponse.json([]);
}
