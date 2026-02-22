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
                        src="https://play.grafana.org/d-solo/000000012/grafana-play-home?orgId=1&panelId=2"
                        title="Grafana Dashboard"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ filter: 'invert(0.9) hue-rotate(180deg)' }} // Simple trick to make light mode demo look dark-ish, or remove if demo supports dark
                    />
                    <div style={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        background: 'rgba(0,0,0,0.7)',
                        padding: '8px 16px',
                        borderRadius: 4,
                        color: '#fff',
                        fontSize: 12
                    }}>
                        Live Demo from play.grafana.org
                    </div>
                </div>
            )}
        </div>
    );
}
