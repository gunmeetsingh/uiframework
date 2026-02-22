import React from 'react';
import { usePermission } from '@/core/auth/usePermission';

interface GuardProps {
    permission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const Guard = ({ permission, children, fallback = null }: GuardProps) => {
    const { can } = usePermission();

    if (!can(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
