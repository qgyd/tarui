import { useState, useCallback } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Select,
  Descriptions,
  Result,
  Progress,
  Modal,
  message,
  Tag,
  Divider,
} from "antd";
import {
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloudDownloadOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setThemeMode, ThemeMode } from "@/store/slices/themeSlice";

const { Title, Text, Paragraph } = Typography;

const APP_VERSION = __APP_VERSION__;

type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "up-to-date" | "error";

function Settings() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state: RootState) => state.theme.mode);

  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateVersion, setUpdateVersion] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [downloadPercent, setDownloadPercent] = useState(0);

  const isTauri = !!(window as any).__TAURI_INTERNALS__;

  const handleThemeChange = (value: ThemeMode) => {
    dispatch(setThemeMode(value));
  };

  const handleCheckUpdate = useCallback(async () => {
    if (!isTauri) {
      message.warning("仅在桌面客户端中可用");
      return;
    }

    setUpdateStatus("checking");
    setDownloadPercent(0);

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();

      if (!update) {
        setUpdateStatus("up-to-date");
        return;
      }

      setUpdateVersion(update.version);
      setUpdateBody(update.body ?? "");
      setUpdateStatus("available");
    } catch (e) {
      console.error("检查更新失败:", e);
      setUpdateStatus("error");
      message.error("检查更新失败，请稍后重试");
    }
  }, [isTauri]);

  const handleDownloadAndInstall = useCallback(async () => {
    setUpdateStatus("downloading");
    setDownloadPercent(0);

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update) return;

      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event: any) => {
        if (event.event === "Started") {
          contentLength =
            typeof event.data?.contentLength === "number"
              ? event.data.contentLength
              : 0;
        }
        if (event.event === "Progress") {
          const chunkLength =
            typeof event.data?.chunkLength === "number"
              ? event.data.chunkLength
              : 0;
          downloaded += chunkLength;
          if (contentLength > 0) {
            setDownloadPercent(
              Math.min(100, Math.round((downloaded / contentLength) * 100))
            );
          }
        }
        if (event.event === "Finished") {
          setDownloadPercent(100);
        }
      });

      message.success("更新已安装，即将重启应用…");
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (e) {
      console.error("下载更新失败:", e);
      setUpdateStatus("error");
      message.error("下载更新失败，请稍后重试");
    }
  }, []);

  const renderUpdateSection = () => {
    switch (updateStatus) {
      case "idle":
        return (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Text type="secondary">
              点击下方按钮检查是否有新版本可用
            </Text>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={handleCheckUpdate}
              disabled={!isTauri}
            >
              检查更新
            </Button>
            {!isTauri && (
              <Text type="warning">当前为浏览器环境，更新功能仅在桌面客户端中可用</Text>
            )}
          </Space>
        );

      case "checking":
        return (
          <Space direction="vertical" align="center" style={{ width: "100%" }}>
            <SyncOutlined spin style={{ fontSize: 32, color: "#1677ff" }} />
            <Text>正在检查更新…</Text>
          </Space>
        );

      case "up-to-date":
        return (
          <Result
            status="success"
            icon={<CheckCircleOutlined />}
            title="已是最新版本"
            subTitle={`当前版本 v${APP_VERSION} 已是最新`}
            extra={
              <Button icon={<SyncOutlined />} onClick={handleCheckUpdate}>
                重新检查
              </Button>
            }
            style={{ padding: "24px 0" }}
          />
        );

      case "available":
        return (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <div
              style={{
                padding: 16,
                borderRadius: 8,
                border: "1px solid #1677ff",
                background: "rgba(22, 119, 255, 0.04)",
              }}
            >
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space>
                  <CloudDownloadOutlined
                    style={{ fontSize: 20, color: "#1677ff" }}
                  />
                  <Text strong style={{ fontSize: 16 }}>
                    发现新版本 v{updateVersion}
                  </Text>
                  <Tag color="blue">可更新</Tag>
                </Space>
                {updateBody && (
                  <>
                    <Divider style={{ margin: "8px 0" }} />
                    <div>
                      <Text type="secondary">更新说明：</Text>
                      <Paragraph
                        style={{
                          whiteSpace: "pre-wrap",
                          marginTop: 4,
                          marginBottom: 0,
                        }}
                      >
                        {updateBody}
                      </Paragraph>
                    </div>
                  </>
                )}
              </Space>
            </div>
            <Space>
              <Button
                type="primary"
                icon={<CloudDownloadOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: "确认更新",
                    content:
                      "下载并安装更新后应用将自动重启，请确保已保存所有工作。",
                    okText: "立即更新",
                    cancelText: "稍后",
                    onOk: handleDownloadAndInstall,
                  });
                }}
              >
                下载并安装
              </Button>
              <Button onClick={handleCheckUpdate}>重新检查</Button>
            </Space>
          </Space>
        );

      case "downloading":
        return (
          <Space
            direction="vertical"
            size={16}
            align="center"
            style={{ width: "100%" }}
          >
            <CloudDownloadOutlined
              style={{ fontSize: 32, color: "#1677ff" }}
            />
            <Text strong>正在下载更新…</Text>
            <Progress
              percent={downloadPercent}
              status="active"
              style={{ maxWidth: 400 }}
            />
            <Text type="secondary">请勿关闭应用</Text>
          </Space>
        );

      case "error":
        return (
          <Result
            status="error"
            title="检查更新失败"
            subTitle="请检查网络连接后重试"
            extra={
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={handleCheckUpdate}
              >
                重试
              </Button>
            }
            style={{ padding: "24px 0" }}
          />
        );
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Title level={2}>设置</Title>

      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <Card title="外观">
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text strong>主题模式</Text>
                <br />
                <Text type="secondary">选择应用的外观主题</Text>
              </div>
              <Select
                value={themeMode}
                onChange={handleThemeChange}
                style={{ width: 160 }}
                options={[
                  {
                    value: "light",
                    label: (
                      <Space>
                        <SunOutlined /> 明亮
                      </Space>
                    ),
                  },
                  {
                    value: "dark",
                    label: (
                      <Space>
                        <MoonOutlined /> 暗黑
                      </Space>
                    ),
                  },
                  {
                    value: "system",
                    label: (
                      <Space>
                        <DesktopOutlined /> 跟随系统
                      </Space>
                    ),
                  },
                ]}
              />
            </div>
          </Space>
        </Card>

        <Card title="应用更新">{renderUpdateSection()}</Card>

        <Card title="关于应用">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="应用名称">
              Rapid Dev
            </Descriptions.Item>
            <Descriptions.Item label="当前版本">
              <Tag color="green">v{APP_VERSION}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="技术栈">
              Tauri 2 + React + Ant Design
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Space>
    </div>
  );
}

export default Settings;
