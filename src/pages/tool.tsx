import { Card, Row, Col, Typography } from 'antd';
import { AudioOutlined, CustomerServiceOutlined, FormOutlined, SwapOutlined, PictureOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';

const { Title, Text } = Typography;

const ICON_STYLE = { fontSize: 48 };

const tools = [
  {
    title: '录音机',
    icon: <AudioOutlined style={{ ...ICON_STYLE, color: '#ff4d4f' }} />,
    path: '/tool/recorder',
    description: '随时随地，记录声音',
  },
  {
    title: '音乐播放',
    icon: <CustomerServiceOutlined style={{ ...ICON_STYLE, color: '#1677ff' }} />,
    path: '/tool/music',
    description: '本地音乐，畅快聆听',
  },
  {
    title: '笔记本',
    icon: <FormOutlined style={{ ...ICON_STYLE, color: '#52c41a' }} />,
    path: '/tool/notebook',
    description: '灵感瞬间，即刻记录',
  },
  {
    title: '媒体转换',
    icon: <SwapOutlined style={{ ...ICON_STYLE, color: '#722ed1' }} />,
    path: '/tool/converter',
    description: '格式转换，轻松搞定',
  },
  {
    title: '图片转换',
    icon: <PictureOutlined style={{ ...ICON_STYLE, color: '#fa8c16' }} />,
    path: '/tool/image-converter',
    description: '图片格式转换，自定义底色',
  },
];

const Tool: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Title level={1}>我的工具箱</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          实用的小工具，让工作更高效
        </Text>
      </div>

      <Row gutter={[24, 24]} justify="center">
        {tools.map((tool) => (
          <Col key={tool.path} xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{
                textAlign: 'center',
                borderRadius: 16,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '20px 0',
                transition: 'all 0.3s',
              }}
              onClick={() => navigate(tool.path)}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ marginBottom: 24 }}>{tool.icon}</div>
              <Title level={4} style={{ marginBottom: 8 }}>
                {tool.title}
              </Title>
              <Text type="secondary">{tool.description}</Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Tool;
