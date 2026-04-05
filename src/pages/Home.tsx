const { Paragraph, Text, Title } = Typography;

function Home() {
  return (
    <section>
      <Space vertical size={20} style={{ width: "100%" }}>
        <Card>
          <Space vertical size={12}>
            <Tag color="blue">Ant Design 已接入</Tag>
            <Title level={2} style={{ margin: 0 }}>
              快速开发控制台页面
            </Title>
            <Paragraph style={{ marginBottom: 0 }}>
              现在你可以直接使用 <Text code>antd</Text> 里的组件搭建后台、表单、
              数据展示和弹窗交互，不用从零写基础样式。
            </Paragraph>
            <Space wrap>
              <Link to="/dashboard">
                <Button type="primary" icon={<RocketOutlined />}>
                  去控制台
                </Button>
              </Link>
              <Link to="/about">
                <Button icon={<SettingOutlined />}>查看关于页</Button>
              </Link>
            </Space>
          </Space>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic title="组件接入速度" value="快" prefix={<ThunderboltOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic title="适合场景" value="后台 / 表单 / 数据页" />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic title="当前状态" value="可直接开发" />
            </Card>
          </Col>
        </Row>

        <Card title="开发建议">
          <Space vertical size={8}>
            <Text>1. 表单页优先使用 `Form`、`Input`、`Select`、`DatePicker`。</Text>
            <Text>2. 列表页优先使用 `Table`、`Tag`、`Pagination`。</Text>
            <Text>3. 反馈交互使用 `message`、`modal`、`notification`。</Text>
          </Space>
          <Divider />
          <Alert
            type="success"
            showIcon
            title="UI 库已可用"
            description="如果你要，我下一步可以继续帮你补一个后台管理模板页，包含侧边栏、表格和表单。"
          />
        </Card>
      </Space>
    </section>
  );
}

export default Home;
