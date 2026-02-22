import {
    DashboardOutlined,
    BarChartOutlined,
    SettingOutlined,
    GlobalOutlined,
    TeamOutlined
} from '@ant-design/icons';
import React from 'react';

export interface ModuleDefinition {
    id: string;
    title: string;
    path: string;
    category: 'Dashboard' | 'Reports' | 'Configuration' | 'Monitor' | 'User Management';
    icon?: React.ReactNode;
    permission: string;
    schema?: string;
}


export const MODULE_REGISTRY: ModuleDefinition[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        path: '/dashboard',
        category: 'Dashboard',
        permission: 'dashboard:read'
    },
    {
        id: 'kpi-report',
        title: 'Telecom KPI',
        path: '/reports/kpi',
        category: 'Reports',
        permission: 'report:telecom:read',
        schema: '/schemas/kpi-report-v2.json'
    },
    {
        id: 'node-config',
        title: 'Network Nodes',
        path: '/configuration/nodes',
        category: 'Configuration',
        permission: 'node:read',
        schema: '/schemas/node-config.json'
    },
    {
        id: 'user-management',
        title: 'User Management',
        path: '/configuration/users',
        category: 'User Management',
        permission: 'user:manage',
        schema: '/schemas/users.json'
    },
    {
        id: 'grafana',
        title: 'Grafana',
        path: '/monitor/grafana',
        category: 'Monitor',
        permission: 'grafana'
    }
];

export const CATEGORIES = [
    { id: 'Dashboard', title: 'Dashboard', icon: React.createElement(DashboardOutlined) },
    { id: 'Reports', title: 'Reports', icon: React.createElement(BarChartOutlined) },
    { id: 'Configuration', title: 'Configuration', icon: React.createElement(SettingOutlined) },
    { id: 'User Management', title: 'User Management', icon: React.createElement(TeamOutlined) },
    { id: 'Monitor', title: 'Monitor Platform', icon: React.createElement(GlobalOutlined) }
];

