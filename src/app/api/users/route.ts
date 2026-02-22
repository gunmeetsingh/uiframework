import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { DEV_USERS } from "@/core/auth/dev-users";

// Persistent mock store for development
let mockUsers = [...DEV_USERS];

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    // Auth Check
    if (!session || !(session.user as any).permissions.includes('user:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // In a real implementation with Keycloak:
    // if (process.env.AUTH_MODE === 'keycloak') {
    //    // Fetch from Keycloak Admin API
    // }

    return NextResponse.json(mockUsers);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    // Auth Check
    if (!session || !(session.user as any).permissions.includes('user:manage')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userData = await req.json();

    // Validation
    if (!userData.username || !userData.email) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In a real implementation with Keycloak:
    // if (process.env.AUTH_MODE === 'keycloak') {
    //    // Create via Keycloak Admin API
    //    // Example: POST /admin/realms/{realm}/users
    // }

    // Development Fallback: Add to mock store
    const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        ...userData,
    };

    mockUsers.push(newUser);

    return NextResponse.json(newUser, { status: 201 });
}
