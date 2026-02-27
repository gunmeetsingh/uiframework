import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbManager } from "@/core/db/manager";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    // Basic Auth Check - Ensure user is logged in
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { dbPool, query } = await req.json();

        if (!dbPool || !query) {
            return NextResponse.json({ error: "Missing dbPool or query" }, { status: 400 });
        }

        // Security Note: In a production app, we would strictly validate/sanitize the query 
        // or use a whitelist of allowed lookup queries to prevent SQL injection.

        const connectionString = (process.env as any)[`${dbPool}_DB_URL`];

        if (connectionString) {
            const pool = await dbManager.getPool(dbPool, connectionString);
            const [rows] = await pool.execute(query);
            return NextResponse.json(rows);
        } else {
            return NextResponse.json({ error: `Connection string not found for pool: ${dbPool}` }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Lookup Failed:", error);
        return NextResponse.json({ error: error.message || "Lookup Failed" }, { status: 500 });
    }
}
