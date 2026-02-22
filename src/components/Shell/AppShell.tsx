"use client";
import React, { useState } from "react";
import { Layout, Menu, Button, Avatar, Dropdown } from "antd";
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined,
    BarChartOutlined,
    SettingOutlined
} from "@ant-design/icons";
import { brandingConfig } from "@/branding.config";
import { useAuth } from "@/core/auth/AuthProvider";
import { useRouter, usePathname } from "next/navigation";

import { TenantProvider } from "@/context/TenantContext";
import { TenantSwitcher } from "./TenantSwitcher";
import { MODULE_REGISTRY, CATEGORIES } from "@/config/modules";


const { Header, Sider, Content } = Layout;

export const AppShell = ({ children }: { children: React.ReactNode }) => {
    return (
        <TenantProvider>
            <AppShellContent>{children}</AppShellContent>
        </TenantProvider>
    );
};

const AppShellContent = ({ children }: { children: React.ReactNode }) => {
    const [collapsed, setCollapsed] = useState(false);
    const { logout, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const menuItems: any[] = CATEGORIES.map((category: any) => {
        const children = MODULE_REGISTRY
            .filter(module => module.category === category.id && user?.permissions?.includes(module.permission))
            .map(module => ({
                key: module.path,
                label: module.title
            }));

        if (children.length === 0) return null;

        return {
            key: category.id,
            icon: category.icon,
            label: category.title,
            children: children.length > 1 || (category.id !== 'Dashboard' && category.id !== 'Monitor' && category.id !== 'User Management') ? children : undefined,
        };

    }).filter(Boolean);

    // Adjust categories with single child to be top-level
    menuItems.forEach((item: any) => {
        if (!item.children || item.children.length === 0) {
            // Check if it's a single page category like Monitor or Dashboard
            const modules = MODULE_REGISTRY.filter(m => m.category === item.key && user?.permissions?.includes(m.permission));
            if (modules.length === 1) {
                item.key = modules[0].path;
            }
        }
    });



    const userMenuItems = [
        {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "Logout",
            onClick: logout,
        }
    ];

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={200}
                style={{
                    overflow: "auto",
                    height: "100vh",
                    position: "fixed",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    background: brandingConfig.theme.sidebarBg
                }}
            >
                <div style={{
                    height: 64,
                    margin: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden"
                }}>
                    {brandingConfig.logo && (
                        <img
                            src={collapsed && brandingConfig.logoSmall ? brandingConfig.logoSmall : brandingConfig.logo}
                            alt="Logo"
                            style={{
                                height: collapsed ? 32 : 50,
                                width: '100%',
                                maxWidth: collapsed ? 32 : 160,
                                objectFit: 'contain'
                            }}
                        />
                    )}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={[pathname]}
                    items={menuItems}
                    onClick={({ key }) => router.push(key)}
                    style={{ background: brandingConfig.theme.sidebarBg }}
                />
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: "all 0.2s", background: brandingConfig.theme.background }}>
                <Header style={{ padding: 0, background: brandingConfig.theme.componentBg, display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 24, color: brandingConfig.theme.textColor }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: "16px", width: 64, height: 64, color: brandingConfig.theme.textColor }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <TenantSwitcher />
                        <Dropdown menu={{ items: userMenuItems }}>
                            <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: brandingConfig.theme.textColor }}>
                                <Avatar icon={<UserOutlined />} style={{ backgroundColor: brandingConfig.theme.primaryColor }} />
                                <span>{user?.name || "User"}</span>
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                <Content
                    style={{
                        margin: "24px 16px",
                        padding: 24,
                        minHeight: 280,
                        background: brandingConfig.theme.componentBg,
                        borderRadius: 8,
                        color: brandingConfig.theme.textColor
                    }}
                >
                    {(() => {
                        const currentModule = MODULE_REGISTRY.find(m => pathname.startsWith(m.path));
                        if (currentModule && !user?.permissions?.includes(currentModule.permission)) {
                            return (
                                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                                    <h2 style={{ color: brandingConfig.theme.primaryColor }}>Access Denied</h2>
                                    <p>You do not have permission to access the "{currentModule.title}" module.</p>
                                    <Button type="primary" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
                                </div>
                            );
                        }
                        return children;
                    })()}
                </Content>

            </Layout>
        </Layout>
    );
};
