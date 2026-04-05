import React, { useState, useRef } from 'react';
import { Card, Button, Space, Typography, List, message } from 'antd';
import { AudioOutlined, StopOutlined, PlayCircleOutlined, DownloadOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';

const { Title, Text } = Typography;

const Recorder: React.FC = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<{ url: string; name: string; id: number }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices) {
        throw new Error('当前环境不支持媒体设备 (navigator.mediaDevices is undefined)。请确保应用运行在安全上下文中，并已配置正确的权限。');
      }
      
      // 检查音频上下文
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!window.MediaRecorder) {
        throw new Error('当前环境不支持录音 (MediaRecorder not found)');
      }
      
      // 检查支持的 MIME 类型
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/ogg')
          ? 'audio/ogg'
          : 'audio/mp4';
          
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const name = `录音 ${new Date().toLocaleString()}`;
        setRecordings((prev) => [...prev, { url, name, id: Date.now() }]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // 每秒收集一次数据块，增加稳定性
      setIsRecording(true);
      message.success('开始录音');
    } catch (err: any) {
      console.error('无法启动录音:', err);
      const errorMsg = err.message || '无法获取麦克风权限';
      message.error(`录音失败: ${errorMsg}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      message.info('录音已停止');
    }
  };

  const deleteRecording = (id: number) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space align="center" style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tool')} />
        <Title level={2} style={{ margin: 0 }}>录音机</Title>
      </Space>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            {isRecording ? (
              <Button
                type="primary"
                danger
                shape="circle"
                icon={<StopOutlined />}
                size="large"
                style={{ width: 80, height: 80, fontSize: 32 }}
                onClick={stopRecording}
              />
            ) : (
              <Button
                type="primary"
                shape="circle"
                icon={<AudioOutlined />}
                size="large"
                style={{ width: 80, height: 80, fontSize: 32 }}
                onClick={startRecording}
              />
            )}
            <div style={{ marginTop: 16 }}>
              <Text type={isRecording ? 'danger' : 'secondary'}>
                {isRecording ? '正在录音...' : '点击图标开始录音'}
              </Text>
            </div>
          </div>

          <Title level={4}>录音列表</Title>
          <List
            bordered
            dataSource={recordings}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="play"
                    type="link"
                    icon={<PlayCircleOutlined />}
                    onClick={() => {
                      const audio = new Audio(item.url);
                      audio.play();
                    }}
                  >
                    播放
                  </Button>,
                  <Button
                    key="download"
                    type="link"
                    icon={<DownloadOutlined />}
                    href={item.url}
                    download={`${item.name}.webm`}
                  >
                    下载
                  </Button>,
                  <Button
                    key="delete"
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteRecording(item.id)}
                  >
                    删除
                  </Button>,
                ]}
              >
                <List.Item.Meta title={item.name} />
              </List.Item>
            )}
            locale={{ emptyText: '暂无录音' }}
          />
        </Space>
      </Card>
    </div>
  );
};

export default Recorder;
