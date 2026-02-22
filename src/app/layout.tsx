"use client";
import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, theme } from "antd";
import { AuthProvider } from "@/core/auth/AuthProvider";
import { SessionProvider } from "next-auth/react";
import { Nunito_Sans } from "next/font/google";
import { brandingConfig } from "@/branding.config";
import "./globals.css";
import { TenantProvider } from "@/context/TenantContext";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={nunito.className} style={{ margin: 0, background: brandingConfig.theme.background }}>
        <SessionProvider>
          <AntdRegistry>
            <ConfigProvider
              theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                  colorPrimary: brandingConfig.theme.primaryColor,
                  colorBgBase: brandingConfig.theme.background,
                  colorBgContainer: brandingConfig.theme.componentBg,
                  colorTextBase: brandingConfig.theme.textColor,
                  fontFamily: nunito.style.fontFamily,
                },
                components: {
                  Layout: {
                    siderBg: '#1e1e1e',
                    bodyBg: brandingConfig.theme.background,
                    headerBg: brandingConfig.theme.componentBg,
                  },
                  Menu: {
                    darkItemBg: '#1e1e1e',
                    darkSubMenuItemBg: brandingConfig.theme.sidebarBg,
                  }
                }
              }}
            >
              <AuthProvider>
                <TenantProvider>
                  {children}
                </TenantProvider>
              </AuthProvider>
            </ConfigProvider>
          </AntdRegistry>
        </SessionProvider>
      </body>
    </html>
  );
}

