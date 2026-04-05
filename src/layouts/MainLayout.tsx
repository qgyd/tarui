import React, { useState, useEffect } from "react";
import { Layout, Menu, theme, Button, Space, Typography, Select, Modal, message } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  HomeOutlined,
  InfoCircleOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ToolOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/userSlice";
import { setThemeMode, ThemeMode } from "@/store/slices/themeSlice";

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { username, isLoggedIn } = useSelector((state: RootState) => state.user);
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      setIsDark(themeMode === "dark");
    }
  }, [themeMode]);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!(window as any).__TAURI_INTERNALS__) return;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const { check } = await import("@tauri-apps/plugin-updater");
          const update = await check();
          if (!update) return;

          Modal.confirm({
            title: `发现新版本 ${update.version}`,
            content: update.body ? <div style={{ whiteSpace: "pre-wrap" }}>{update.body}</div> : "检测到新版本，是否现在下载并安装？",
            okText: "下载并安装",
            cancelText: "稍后",
            async onOk() {
              const key = "updater";

              try {
                let downloaded = 0;
                let contentLength = 0;

                message.open({ key, type: "loading", content: "准备下载更新…" });
                await update.downloadAndInstall((event: any) => {
                  if (event.event === "Started") {
                    contentLength = typeof event.data?.contentLength === "number" ? event.data.contentLength : 0;
                    message.open({ key, type: "loading", content: "开始下载更新…" });
                    return;
                  }
                  if (event.event === "Progress") {
                    const chunkLength = typeof event.data?.chunkLength === "number" ? event.data.chunkLength : 0;
                    downloaded += chunkLength;
                    if (contentLength > 0) {
                      const percent = Math.min(100, Math.round((downloaded / contentLength) * 100));
                      message.open({ key, type: "loading", content: `正在下载更新… ${percent}%` });
                    } else {
                      const mb = Math.max(0, Math.round(downloaded / 1024 / 1024));
                      message.open({ key, type: "loading", content: `正在下载更新… ${mb}MB` });
                    }
                    return;
                  }
                  if (event.event === "Finished") {
                    message.open({ key, type: "loading", content: "下载完成，正在安装…" });
                  }
                });

                message.success({ key, content: "更新已安装，正在重启…" });
                const { relaunch } = await import("@tauri-apps/plugin-process");
                await relaunch();
              } catch (e) {
                message.error({ key, content: "更新失败，请稍后重试" });
                throw e;
              }
            },
          });
        } catch (e) {
          console.warn("update check failed", e);
        }
      })();
    }, 1500);

    return () => window.clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleThemeChange = (value: ThemeMode) => {
    dispatch(setThemeMode(value));
  };

  const menuItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: "/about",
      icon: <InfoCircleOutlined />,
      label: <Link to="/about">关于</Link>,
    },
    {
      key: "/tool",
      icon: <ToolOutlined />,
      label: <Link to="/tool">工具</Link>,
    },
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">控制台</Link>,
    },
    {
      key: "/settings",
      icon: <SettingOutlined />,
      label: <Link to="/settings">设置</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 0,
          background: isDark ? "#001529" : "#fff",
          borderBottom: isDark ? "none" : "1px solid #f0f0f0",
        }}>
        <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <div
            className="demo-logo"
            style={{ color: isDark ? "white" : "#001529", padding: "0 24px", fontSize: 18, fontWeight: "bold" }}>
            Rapid Dev
          </div>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
              color: isDark ? "white" : "rgba(0, 0, 0, 0.88)",
            }}
          />
        </div>
        <Space style={{ paddingRight: 24 }}>
          <Select
            value={themeMode}
            onChange={handleThemeChange}
            options={[
              { value: "light", label: <SunOutlined title="明亮" /> },
              { value: "dark", label: <MoonOutlined title="黑暗" /> },
              { value: "system", label: <DesktopOutlined title="跟随系统" /> },
            ]}
            variant="borderless"
            style={{ width: 60 }}
            dropdownStyle={{ minWidth: 100 }}
          />
          {isLoggedIn && (
            <>
              <Text style={{ color: isDark ? "white" : "rgba(0, 0, 0, 0.88)" }}>欢迎, {username}</Text>
              <Button
                type="link"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ color: isDark ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.45)" }}>
                退出
              </Button>
            </>
          )}
        </Space>
      </Header>
      <Layout style={{ height: "calc(100vh - 64px)" }}>
        <Sider trigger={null} collapsible collapsed={collapsed} width={150} theme={isDark ? "dark" : "light"} style={{ overflowY: "auto" }}>
          <Menu
            theme={isDark ? "dark" : "light"}
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ height: "100%", borderRight: 0 }}
          />
        </Sider>
        <Content style={{ padding: "0 24px", height: "100%", overflowY: "auto" }}>
          <div
            style={{
              background: colorBgContainer,
              minHeight: 280,
              padding: 24,
              borderRadius: borderRadiusLG,
              marginTop: 24,
            }}>
            <Outlet />
          </div>
          <Footer style={{ textAlign: "center" }}>{`当前年份 ©${new Date().getFullYear()}`}</Footer>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
