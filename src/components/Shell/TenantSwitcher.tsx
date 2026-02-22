
"use client";
import React from 'react';
import { Select, Space, ConfigProvider } from 'antd';
import { brandingConfig } from '@/branding.config';
import { useTenant } from '@/context/TenantContext';

export const TenantSwitcher = () => {
    const { tenant, tenants, setTenant, isLoading } = useTenant();

    return (
        <Space>
            <span style={{ color: '#fff' }}>Tenant:</span>
            <ConfigProvider
                theme={{
                    components: {
                        Select: {
                            selectorBg: brandingConfig.theme.componentBg,
                            colorText: brandingConfig.theme.textColor,
                            colorBgElevated: brandingConfig.theme.componentBg,
                            optionSelectedBg: brandingConfig.theme.primaryColor,
                            optionSelectedColor: '#ffffff',
                            colorTextPlaceholder: '#9CA3AF',
                            colorPrimary: brandingConfig.theme.primaryColor,
                            controlItemBgHover: '#374151',
                        }
                    }
                }}
            >
                <Select
                    value={tenant ? tenant.id : undefined}
                    onChange={(value) => {
                        const selected = tenants.find((t) => t.id === value);
                        if (selected) {
                            setTenant(selected);
                            // Optional: Force reload if context is deep
                            // window.location.reload(); 
                        }
                    }}
                    style={{ width: 140 }}
                    placeholder={isLoading ? "Loading..." : "Select Tenant"}
                    options={tenants.map(t => ({ label: t.name, value: t.id }))}
                    loading={isLoading}
                />
            </ConfigProvider>
        </Space>
    );
};
