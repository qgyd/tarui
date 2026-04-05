import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, Descriptions, List, Progress, Space, Spin, Typography, Row, Col, Divider, Tag } from "antd";
import { DesktopOutlined, ClusterOutlined, DatabaseOutlined, HddOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface CpuInfo {
  name: string;
  brand: string;
  frequency: number;
}

interface DiskInfo {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
}

interface SystemInfo {
  system_name: string | null;
  kernel_version: string | null;
  os_version: string | null;
  host_name: string | null;
  cpu_info: CpuInfo[];
  total_memory: number;
  used_memory: number;
  disks: DiskInfo[];
}

function About() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const info = await invoke<SystemInfo>("get_system_info");
        setSystemInfo(info);
      } catch (error) {
        console.error("Failed to fetch system info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
    const interval = setInterval(fetchInfo, 5000); // 每5秒更新一次
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <Spin size="large" tip="正在获取系统信息..." />
      </div>
    );
  }

  if (!systemInfo) {
    return <div>无法获取系统信息</div>;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const memPercent = Math.round((systemInfo.used_memory / systemInfo.total_memory) * 100);

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2} style={{ marginBottom: "24px" }}>
        <DesktopOutlined /> 系统信息概览
      </Title>

      <Row gutter={[16, 16]}>
        {/* 基础系统信息 */}
        <Col span={24}>
          <Card title="基础信息" variant="outlined">
            <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
              <Descriptions.Item label="操作系统">{systemInfo.system_name || "未知"}</Descriptions.Item>
              <Descriptions.Item label="系统版本">{systemInfo.os_version || "未知"}</Descriptions.Item>
              <Descriptions.Item label="内核版本">{systemInfo.kernel_version || "未知"}</Descriptions.Item>
              <Descriptions.Item label="主机名称">{systemInfo.host_name || "未知"}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 内存信息 */}
        <Col span={24} md={12}>
          <Card title={<><ClusterOutlined /> 内存状态</>} variant="outlined">
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <Progress type="dashboard" percent={memPercent} strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }} />
              <div style={{ marginTop: "10px" }}>
                <Text type="secondary">已用: {formatBytes(systemInfo.used_memory)}</Text>
                <Divider type="vertical" />
                <Text type="secondary">总计: {formatBytes(systemInfo.total_memory)}</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 处理器信息 */}
        <Col span={24} md={12}>
          <Card title={<><DatabaseOutlined /> 处理器 (CPU)</>} variant="outlined" style={{ height: "100%" }}>
            <List
              dataSource={systemInfo.cpu_info.slice(0, 8)} // 只显示前8个核心，防止列表过长
              renderItem={(cpu) => (
                <List.Item>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text strong>{cpu.name}</Text>
                      <Tag color="blue">{cpu.frequency} MHz</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{cpu.brand}</Text>
                  </Space>
                </List.Item>
              )}
              footer={systemInfo.cpu_info.length > 8 ? <Text type="secondary">...及其他 {systemInfo.cpu_info.length - 8} 个核心</Text> : null}
            />
          </Card>
        </Col>

        {/* 磁盘信息 */}
        <Col span={24}>
          <Card title={<><HddOutlined /> 磁盘状态</>} variant="outlined">
            <Row gutter={[16, 16]}>
              {systemInfo.disks.map((disk, index) => {
                const used = disk.total_space - disk.available_space;
                const percent = Math.round((used / disk.total_space) * 100);
                return (
                  <Col span={24} lg={12} key={index}>
                    <div style={{ padding: "12px", border: "1px solid #f0f0f0", borderRadius: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <Text strong>{disk.name || "本地磁盘"} ({disk.mount_point})</Text>
                        <Text type="secondary">{formatBytes(used)} / {formatBytes(disk.total_space)}</Text>
                      </div>
                      <Progress percent={percent} status={percent > 90 ? "exception" : "active"} />
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default About;
