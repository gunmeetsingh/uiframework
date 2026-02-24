"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { Result, Button, Spin } from 'antd';
import { brandingConfig } from '@/branding.config';

export default function GrafanaPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading external content
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    if (!user?.permissions?.includes('grafana')) {
        return (
            <Result
                status="403"
                title="403"
                subTitle="Sorry, you are not authorized to access the Grafana Monitor Platform."
                extra={<Button type="primary">Back Home</Button>}
            />
        );
    }

    const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL || "https://play.grafana.org/d-solo/000000012/grafana-play-home?orgId=1&panelId=2";

    // Append theme=dark if not present (simple check)
    const finalUrl = grafanaUrl.includes('?')
        ? `${grafanaUrl}&theme=dark`
        : `${grafanaUrl}?theme=dark`;

    return (
        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ marginBottom: 16 }}>Grafana Monitor Platform</h1>

            {loading ? (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <div style={{
                    flex: 1,
                    border: `1px solid ${brandingConfig.theme.primaryColor}`,
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#111',
                    position: 'relative'
                }}>
                    <iframe
                        src={finalUrl}
                        title="Grafana Dashboard"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                    />
                </div>
            )}
        </div>
    );
}
