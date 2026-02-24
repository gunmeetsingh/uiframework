import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

import { dbManager } from "@/core/db/manager";
import { AuditLogger } from "@/core/utils/audit-logger";

// Mock data matching the user's table structure
let mockImsiRanges = [
    { imsirange_name: 'Range-001', from_imsi: '405800000000001', to_imsi: '405800000000999' },
    { imsirange_name: 'Range-002', from_imsi: '405810000000001', to_imsi: '405810000000999' }
];

import schemaRaw from "@/schemas/gtp-imsi-range.json";
const schema = schemaRaw as any;

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    // Auth Check
    if (!session || !(session.user as any).permissions.includes('gtp:imsi:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Try to use the database pool
    try {
        const poolName = schema.dbPool;
        const connectionString = (process.env as any)[`${poolName}_DB_URL`];

        if (connectionString) {
            const pool = await dbManager.getPool(poolName, connectionString);
            const [rows] = await pool.execute(`SELECT * FROM ${schema.tableName}`);
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
        const poolName = schema.dbPool;
        const connectionString = (process.env as any)[`${poolName}_DB_URL`];

        if (connectionString) {
            const pool = await dbManager.getPool(poolName, connectionString);
            await pool.execute(
                `INSERT INTO ${schema.tableName} (imsirange_name, from_imsi, to_imsi) VALUES (?, ?, ?)`,
                [data.imsirange_name, data.from_imsi, data.to_imsi]
            );

            await AuditLogger.log({
                username: (session.user as any).email || (session.user as any).name,
                screen: schema.title,
                action: 'Data Insert',
                status: 'Success',
                details: `Inserted IMSI Range: ${data.imsirange_name}. Query: INSERT INTO ${schema.tableName} (imsirange_name, from_imsi, to_imsi) VALUES ('${data.imsirange_name}', '${data.from_imsi}', '${data.to_imsi}')`
            });

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

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).permissions.includes('gtp:imsi:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { _identifiers, ...data } = await req.json();

    try {
        const poolName = schema.dbPool;
        const connectionString = (process.env as any)[`${poolName}_DB_URL`];

        if (connectionString) {
            const pool = await dbManager.getPool(poolName, connectionString);

            // Build SET clause
            const setClause = Object.keys(data).map(key => `\`${key}\` = ?`).join(', ');
            const setValues = Object.values(data);

            // Build WHERE clause based on identifiers
            const whereClause = Object.keys(_identifiers).map(key => `\`${key}\` = ?`).join(' AND ');
            const whereValues = Object.values(_identifiers);

            const sql = `UPDATE ${schema.tableName} SET ${setClause} WHERE ${whereClause}`;
            await pool.execute(sql, [...setValues, ...whereValues] as any[]);

            await AuditLogger.log({
                username: (session.user as any).email || (session.user as any).name,
                screen: schema.title,
                action: 'Data Update',
                status: 'Success',
                details: `Updated record. SQL: ${sql} | Values: ${JSON.stringify([...setValues, ...whereValues])}`
            });

            return NextResponse.json({ success: true, data });
        }
    } catch (error) {
        console.error("Database Update Failed (PUT):", error);
        return NextResponse.json({ error: "Database Update Failed" }, { status: 500 });
    }

    return NextResponse.json({ error: "DB Not Configured" }, { status: 500 });
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).permissions.includes('gtp:imsi:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const identifiers = await req.json();

    try {
        const poolName = schema.dbPool;
        const connectionString = (process.env as any)[`${poolName}_DB_URL`];

        if (connectionString) {
            const pool = await dbManager.getPool(poolName, connectionString);

            const whereClause = Object.keys(identifiers).map(key => `\`${key}\` = ?`).join(' AND ');
            const whereValues = Object.values(identifiers);

            const sql = `DELETE FROM ${schema.tableName} WHERE ${whereClause}`;
            await pool.execute(sql, whereValues as any[]);

            await AuditLogger.log({
                username: (session.user as any).email || (session.user as any).name,
                screen: schema.title,
                action: 'Data Delete',
                status: 'Success',
                details: `Deleted record. WHERE ${whereClause} | Values: ${JSON.stringify(whereValues)}`
            });

            return NextResponse.json({ success: true });
        }
    } catch (error) {
        console.error("Database Delete Failed (DELETE):", error);
        return NextResponse.json({ error: "Database Delete Failed" }, { status: 500 });
    }

    return NextResponse.json({ error: "DB Not Configured" }, { status: 500 });
}
