"use client";
import React from 'react';
import { Row, Col, Card, Statistic, Table } from 'antd';
import ReactECharts from 'echarts-for-react';
import * as Icons from '@ant-design/icons';
import dayjs from 'dayjs';
import { brandingConfig } from '@/branding.config';

// --- Schema Definitions ---

export type WidgetType = 'statistic' | 'chart' | 'table' | 'text';

export interface BaseWidget {
    type: WidgetType;
    title?: string;
}

export interface StatisticWidget extends BaseWidget {
    type: 'statistic';
    value: string | number;
    prefixIcon?: string;
    suffix?: string;
    precision?: number;
    color?: string; // Color override for icon/value
}

export interface ChartWidget extends BaseWidget {
    type: 'chart';
    chartType: 'line' | 'bar' | 'pie';
    xAxis?: string[];
    series: {
        name: string;
        data: number[];
    }[];
    height?: number;
}

export interface TableWidget extends BaseWidget {
    type: 'table';
    columns: { title: string; dataIndex: string; key: string }[];
    data: any[];
}

export interface TextWidget extends BaseWidget {
    type: 'text';
    content: string;
}

export type WidgetConfig = StatisticWidget | ChartWidget | TableWidget | TextWidget;

export interface ColConfig {
    span: number;
    widget: WidgetConfig;
}

export interface RowConfig {
    gutter?: number;
    columns: ColConfig[];
}


// --- Filter Types ---

// Re-export or redefine if needed, but for simplicity let's define inline or import
interface FilterConfig {
    key: string;
    type: 'dateRange' | 'select';
    label?: string;
    defaultValue?: any;
    options?: { label: string; value: any }[];
    placeholder?: string;
}

export interface PageSchema {
    title: string;
    filters?: FilterConfig[];
    rows: RowConfig[];
}


// --- Widget Factory ---

interface WidgetRendererProps<T extends WidgetConfig> {
    widget: T;
    filters?: Record<string, any>;
}

const renderIcon = (iconName?: string, color?: string) => {
    if (!iconName) return null;
    // @ts-ignore - dynamic access to icons
    const IconComponent = Icons[iconName];
    if (IconComponent) {
        return <IconComponent style={{ fontSize: '24px', color: color || brandingConfig.theme.primaryColor }} />;
    }
    return null;
};

const StatisticRenderer = ({ widget, filters }: WidgetRendererProps<StatisticWidget>) => (
    <Card bordered={false} style={{ background: brandingConfig.theme.componentBg, height: '100%' }}>
        <Statistic
            title={<span style={{ color: brandingConfig.theme.textColor }}>{widget.title}</span>}
            value={widget.value}
            precision={widget.precision}
            valueStyle={{ color: brandingConfig.theme.textColor }}
            prefix={renderIcon(widget.prefixIcon, widget.color)}
            suffix={widget.suffix}
        />
    </Card>
);

const ChartRenderer = ({ widget, filters }: WidgetRendererProps<ChartWidget>) => {
    // Example: Use filters to modify title or data (mocking DB query)
    const titleSuffix = filters?.dateRange ? ` (${dayjs(filters.dateRange[0]).format('MM/DD')} - ${dayjs(filters.dateRange[1]).format('MM/DD')})` : '';

    const option = {
        title: {
            text: widget.title + titleSuffix,
            textStyle: { color: brandingConfig.theme.textColor }
        },
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: widget.chartType === 'pie' ? undefined : {
            type: 'category',
            data: widget.xAxis || [],
            axisLabel: { color: brandingConfig.theme.textColor },
            axisLine: { lineStyle: { color: brandingConfig.theme.textColor } }
        },
        yAxis: widget.chartType === 'pie' ? undefined : {
            type: 'value',
            axisLabel: { color: brandingConfig.theme.textColor },
            splitLine: { lineStyle: { color: '#333' } }
        },
        series: widget.series.map(s => ({
            name: s.name,
            type: widget.chartType,
            data: s.data,
            itemStyle: { color: brandingConfig.theme.primaryColor }
        }))
    };

    return (
        <Card bordered={false} style={{ background: brandingConfig.theme.componentBg }}>
            <ReactECharts option={option} style={{ height: widget.height || 450 }} />
        </Card>
    );
};

const TableRenderer = ({ widget, filters }: WidgetRendererProps<TableWidget>) => {
    // Process columns to add sorting and filtering
    const processedColumns = widget.columns.map((col, index) => {
        // Generate filters from data
        const uniqueValues = Array.from(new Set(widget.data.map(item => item[col.dataIndex]))).filter(Boolean);
        const filters = uniqueValues.map(val => ({ text: String(val), value: val }));

        return {
            ...col,
            sorter: {
                compare: (a: any, b: any) => {
                    const valA = a[col.dataIndex];
                    const valB = b[col.dataIndex];
                    if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
                    return String(valA).localeCompare(String(valB));
                },
                multiple: index + 1 // Allow multi-column sorting
            },
            filters: filters.length > 0 ? filters : undefined,
            onFilter: (value: any, record: any) => {
                const recordVal = record[col.dataIndex];
                // loose equality for flexibility
                return recordVal == value;
            },
        };
    });

    return (
        <Card title={<span style={{ color: brandingConfig.theme.textColor }}>{widget.title}</span>} bordered={false} style={{ background: brandingConfig.theme.componentBg }}>
            <Table
                columns={processedColumns}
                dataSource={widget.data}
                pagination={false}
                rowKey="id"
                scroll={{ x: 'max-content' }} // Ensure table is scrollable if many columns
            />
        </Card>
    );
};

const TextRenderer = ({ widget, filters }: WidgetRendererProps<TextWidget>) => (
    <Card title={<span style={{ color: brandingConfig.theme.textColor }}>{widget.title}</span>} bordered={false} style={{ background: brandingConfig.theme.componentBg }}>
        <p style={{ color: brandingConfig.theme.textColor }}>{widget.content}</p>
    </Card>
);

const WidgetFactory = ({ widget, filters }: { widget: WidgetConfig; filters?: Record<string, any> }) => {
    switch (widget.type) {
        case 'statistic':
            return <StatisticRenderer widget={widget} />;
        case 'chart':
            return <ChartRenderer widget={widget} filters={filters} />;
        case 'table':
            return <TableRenderer widget={widget} filters={filters} />;
        case 'text':
            return <TextRenderer widget={widget} filters={filters} />;
        default:
            return <div>Unknown Widget Type</div>;
    }
};


// --- Main Engine ---

import { FilterEngine } from './FilterEngine';
import { useState } from 'react';

export const PageEngine = ({ schema }: { schema: PageSchema }) => {
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});

    const handleFilterChange = (newValues: Record<string, any>) => {
        setFilterValues(prev => ({ ...prev, ...newValues }));
        console.log("Filters Updated:", { ...filterValues, ...newValues });
        // In a real app, this would trigger a data refetch or refilter logic here.
    };

    return (
        <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ margin: 0, paddingLeft: 8 }}>{schema.title}</h1>
            </div>

            {schema.filters && schema.filters.length > 0 && (
                <FilterEngine
                    filters={schema.filters}
                    onFilterChange={handleFilterChange}
                />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {schema.rows.map((row, rIndex) => (
                    <Row key={rIndex} gutter={row.gutter || 16}>
                        {row.columns.map((col, cIndex) => (
                            <Col key={cIndex} span={col.span}>
                                <WidgetFactory widget={col.widget} filters={filterValues} />
                            </Col>
                        ))}
                    </Row>
                ))}
            </div>
        </div>
    );
};
