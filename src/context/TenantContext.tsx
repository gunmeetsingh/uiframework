
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';

export interface Tenant {
    id: string;
    name: string;
    description?: string;
}

interface TenantContextType {
    tenant: Tenant | null;
    tenants: Tenant[];
    setTenant: (tenant: Tenant) => void;
    isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulating API fetch based on user
        const fetchTenants = async () => {
            setIsLoading(true);
            try {
                // Mock data - in real app, fetch from /api/tenants
                // Different users could see different tenants
                const mockTenants: Tenant[] = [
                    { id: 't1', name: 'Acme Corp', description: 'Main organization' },
                    { id: 't2', name: 'Globex Inc', description: 'Subsidiary' },
                    { id: 't3', name: 'Soylent Corp', description: 'Research division' },
                ];

                // If user is admin, they might see all. If standard user, maybe subset.
                // For now, everyone sees all mock tenants.
                setTenants(mockTenants);

                // Default to first tenant if none selected
                // Or load from localStorage
                const savedTenantId = localStorage.getItem('selectedTenantId');
                const foundTenant = mockTenants.find(t => t.id === savedTenantId);

                if (foundTenant) {
                    setTenant(foundTenant);
                } else if (mockTenants.length > 0) {
                    setTenant(mockTenants[0]);
                }
            } catch (error) {
                console.error("Failed to fetch tenants", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchTenants();
        }
    }, [user]);

    const handleSetTenant = (newTenant: Tenant) => {
        setTenant(newTenant);
        localStorage.setItem('selectedTenantId', newTenant.id);
        // You might want to reload the page or trigger a global refresh here if deep state depends on tenant
        // window.location.reload(); 
    };

    return (
        <TenantContext.Provider value={{ tenant, tenants, setTenant: handleSetTenant, isLoading }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
