import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbManager } from "@/core/db/manager";
import { AuditLogger } from "@/core/utils/audit-logger";
import schemaRaw from "@/schemas/gtp-mccmnc-mapping.json";
const schema = schemaRaw as any;

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).permissions.includes('gtp:mapping:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const poolName = schema.dbPool;
        const connectionString = (process.env as any)[`${poolName}_DB_URL`];

        if (connectionString) {
            const pool = await dbManager.getPool(poolName, connectionString);
            const [rows] = await pool.execute(`SELECT * FROM ${schema.tableName}`);
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
        const poolName = schema.dbPool;
        const connectionString = (process.env as any)[`${poolName}_DB_URL`];

        if (connectionString) {
            const pool = await dbManager.getPool(poolName, connectionString);
            await pool.execute(
                `INSERT INTO ${schema.tableName} (network_name, mcc, mnc, mnc_touse_for_handling) VALUES (?, ?, ?, ?)`,
                [data.network_name, data.mcc, data.mnc, data.mnc_touse_for_handling]
            );
            await AuditLogger.log({
                username: (session.user as any).email || (session.user as any).name,
                screen: schema.title,
                action: 'Data Insert',
                status: 'Success',
                details: `Inserted MCC-MNC Mapping: ${data.network_name}. Params: ${JSON.stringify(data)}`
            });
            return NextResponse.json(data, { status: 201 });
        }
    } catch (error) {
        console.error("Database Save Failed (Mappings POST):", error);
        return NextResponse.json({ error: "Database Save Failed" }, { status: 500 });
    }

    return NextResponse.json({ error: "DB URL Not Configured" }, { status: 500 });
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).permissions.includes('gtp:mapping:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { _identifiers, ...data } = await req.json();

    try {
        const poolName = schema.dbPool;
        const connectionString = (process.env as any)[`${poolName}_DB_URL`];

        if (connectionString) {
            const pool = await dbManager.getPool(poolName, connectionString);
            const setClause = Object.keys(data).map(key => `\`${key}\` = ?`).join(', ');
            const setValues = Object.values(data);
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
    if (!session || !(session.user as any).permissions.includes('gtp:mapping:manage')) {
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
