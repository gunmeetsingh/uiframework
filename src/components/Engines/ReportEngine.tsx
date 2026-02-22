"use client";
import React from 'react';
import ReactECharts from 'echarts-for-react';

interface ReportSchema {
    title: string;
    type: 'line' | 'bar' | 'pie';
    xAxis?: string[];
    series: {
        name: string;
        data: number[];
    }[];
}

// In a real scenario, we would fetch data based on schema.dataSource
// For this verification, we assume data is embedded or we mock it.

interface ReportProps {
    schema: ReportSchema;
}

import { brandingConfig } from '@/branding.config';

export const ReportEngine = ({ schema }: ReportProps) => {
    const option = {
        title: {
            text: schema.title,
            textStyle: { color: brandingConfig.theme.textColor }
        },
        toolbox: {
            feature: {
                saveAsImage: { title: 'Save as Image' },
                dataView: { title: 'Data View', readOnly: false },
                restore: { title: 'Restore' }
            },
            iconStyle: {
                borderColor: brandingConfig.theme.textColor
            },
            right: 20
        },
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: brandingConfig.theme.componentBg,
            textStyle: { color: brandingConfig.theme.textColor },
            borderColor: brandingConfig.theme.primaryColor
        },
        xAxis: {
            type: 'category',
            data: schema.xAxis || [],
            axisLabel: { color: brandingConfig.theme.textColor },
            axisLine: { lineStyle: { color: brandingConfig.theme.textColor } }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: brandingConfig.theme.textColor },
            splitLine: { lineStyle: { color: '#333' } }
        },
        series: schema.series.map(s => ({
            name: s.name,
            type: schema.type,
            data: s.data,
            itemStyle: { color: brandingConfig.theme.primaryColor } // Base color, ECharts will cycle but good to have a default
        }))
    };

    return (
        <div style={{ background: brandingConfig.theme.componentBg, padding: 24, borderRadius: 8 }}>
            <ReactECharts option={option} style={{ height: '400px', width: '100%' }} />
        </div>
    );
};
