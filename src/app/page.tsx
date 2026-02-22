"use client";
import { Button, Card, Input, Form } from 'antd';
import { useAuth } from '@/core/auth/AuthProvider';
import { brandingConfig } from '@/branding.config';

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: `url('/login-bg.webp')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <Card style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: brandingConfig.theme.primaryColor }}>{brandingConfig.appName}</h1>
          <p>Login to access the portal</p>
        </div>
        <Form layout="vertical" onFinish={login}>
          <Form.Item label="Username" name="username" initialValue="admin">
            <Input />
          </Form.Item>
          <Form.Item label="Password" name="password" initialValue="admin">
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
