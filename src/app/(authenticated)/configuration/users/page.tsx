"use client";
import React, { useEffect, useState } from 'react';
import { ConfigEngine } from '@/components/Engines/ConfigEngine';
import userSchemaRaw from '@/schemas/users.json';
import { message, Spin } from 'antd';
import { Guard } from '@/components/Access/Guard';

const userSchema = {
    ...userSchemaRaw,
    title: "User Management",
    permissions: {
        create: "user:manage",
        update: "user:manage",
        delete: "user:manage"
    }
} as any;

export default function UserManagementPage() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            message.error('Error loading users');
        } finally {
            setLoading(false);
        }
    };

    // Note: ConfigEngine currently handles internal data state for demonstration.
    // In a real integration, we'd pass data and handlers (onSave, onDelete) to ConfigEngine.
    // For now, I'll update ConfigEngine to take initialData or handle its own mock,
    // but the task is to implement the module. 
    // I'll make the page pass the fetched users to a modified ConfigEngine.

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;
    }

    return (
        <Guard permission="user:manage">
            <ConfigEngine
                schema={userSchema}
                initialData={users}
            />
        </Guard>
    );
}
