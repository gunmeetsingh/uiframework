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

    const menuItems = [
        {
            key: "/dashboard",
            icon: <DashboardOutlined />,
            label: "Dashboard",
        },
        {
            key: "/reports",
            icon: <BarChartOutlined />,
            label: "Reports",
            children: [
                { key: "/reports/kpi", label: "Telecom KPI" },
            ],
        },
        {
            key: "/configuration",
            icon: <SettingOutlined />,
            label: "Configuration",
            children: [
                { key: "/configuration/nodes", label: "Network Nodes" },
            ],
        },
    ];

    if (user?.permissions?.includes('grafana')) {
        menuItems.push({
            key: "/monitor",
            icon: <span role="img" aria-label="monitor" className="anticon"><svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor"><path d="M928 224H96c-17.7 0-32 14.3-32 32v576c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V256c0-17.7-14.3-32-32-32zm-40 568H136V296h752v496zM304 480c0-4.4 3.6-8 8-8h400c4.4 0 8 3.6 8 8v48c0 4.4-3.6 8-8 8H312c-4.4 0-8-3.6-8-8v-48zm0 136c0-4.4 3.6-8 8-8h280c4.4 0 8 3.6 8 8v48c0 4.4-3.6 8-8 8H312c-4.4 0-8-3.6-8-8v-48z" /></svg></span>,
            label: "Monitor Platform",
            children: [
                { key: "/monitor/grafana", label: "Grafana" },
            ]
        } as any);
    }

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
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};
