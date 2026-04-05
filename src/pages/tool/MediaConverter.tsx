import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Button, Space, Typography, Select, message, Progress, Empty } from 'antd';
import { SwapOutlined, DeleteOutlined, ArrowLeftOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { getCurrentWebview } from '@tauri-apps/api/webview';

const { Title, Text } = Typography;
const { Option } = Select;

const MediaConverter: React.FC = () => {
  const navigate = useNavigate();
  const [inputPath, setInputPath] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState('mp4');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultPath, setResultPath] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const isPointerOverDropZoneRef = useRef(false);

  const allowedExtensions = useMemo(
    () => new Set(['mp4', 'avi', 'mkv', 'mov', 'mp3', 'wav', 'ogg', 'webm']),
    []
  );

  useEffect(() => {
    let unlisten: null | (() => void) = null;

    const setup = async () => {
      unlisten = await getCurrentWebview().onDragDropEvent((event: any) => {
        const payload = event?.payload;
        if (!payload || !dropZoneRef.current) return;

        if (payload.type === 'over') {
          const rect = dropZoneRef.current.getBoundingClientRect();
          const position = payload.position;
          const isOver =
            position &&
            typeof position.x === 'number' &&
            typeof position.y === 'number' &&
            position.x >= rect.left &&
            position.x <= rect.right &&
            position.y >= rect.top &&
            position.y <= rect.bottom;

          isPointerOverDropZoneRef.current = Boolean(isOver);
          setIsDragOver(Boolean(isOver));
          return;
        }

        if (payload.type === 'drop') {
          setIsDragOver(false);

          if (!isPointerOverDropZoneRef.current) return;

          const paths: string[] = Array.isArray(payload.paths) ? payload.paths : [];
          const firstPath = paths[0];
          if (!firstPath) return;

          const fileName = firstPath.split('/').pop() ?? firstPath;
          const ext = (fileName.split('.').pop() ?? '').toLowerCase();
          if (!allowedExtensions.has(ext)) {
            message.error('不支持的文件类型，请拖拽媒体文件');
            return;
          }

          setInputPath(firstPath);
          setResultPath(null);
          setProgress(0);
          message.success(`已选择: ${fileName}`);
          return;
        }

        if (payload.type === 'cancel') {
          isPointerOverDropZoneRef.current = false;
          setIsDragOver(false);
        }
      });
    };

    setup();

    return () => {
      isPointerOverDropZoneRef.current = false;
      setIsDragOver(false);
      if (unlisten) unlisten();
    };
  }, [allowedExtensions]);

  const handleSelectFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Media Files',
          extensions: ['mp4', 'avi', 'mkv', 'mov', 'mp3', 'wav', 'ogg', 'webm']
        }]
      });

      if (selected && !Array.isArray(selected)) {
        setInputPath(selected);
        setResultPath(null);
        setProgress(0);
      }
    } catch (err) {
      console.error('选择文件失败:', err);
      message.error('选择文件失败');
    }
  };

  const handleConvert = async () => {
    if (!inputPath) {
      message.error('请先选择文件');
      return;
    }

    // 获取输入文件的所在目录和文件名（不含扩展名）
    const lastSlashIndex = inputPath.lastIndexOf('/');
    const directory = inputPath.substring(0, lastSlashIndex + 1);
    const fileName = inputPath.substring(lastSlashIndex + 1);
    const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.');
    const defaultOutputPath = `${directory}${fileNameWithoutExt}_converted.${targetFormat}`;

    // 允许用户选择保存位置
    const outputPath = await save({
      defaultPath: defaultOutputPath,
      filters: [{
        name: 'Target Format',
        extensions: [targetFormat]
      }]
    });

    if (!outputPath) return;

    setIsConverting(true);
    setProgress(0);
    // 注意：原生转换目前没有简单的进度条，除非我们解析 ffmpeg 的 stderr 输出。
    // 为了用户体验，我们先显示一个加载状态。
    setProgress(50); 

    try {
      console.log('开始原生转换:', inputPath, '->', outputPath);
      const result = await invoke<string>('convert_media_native', {
        inputPath,
        outputPath,
      });

      setResultPath(result);
      setProgress(100);
      message.success('转换完成');
    } catch (error: any) {
      console.error('转换失败:', error);
      message.error(`转换失败: ${error}`);
    } finally {
      setIsConverting(false);
    }
  };

  const formats = ['mp4', 'avi', 'mkv', 'mov', 'mp3', 'wav', 'ogg'];

  return (
    <div style={{ padding: '24px' }}>
      <Space align="center" style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tool')} />
        <Title level={2} style={{ margin: 0 }}>媒体转换器 (原生加速)</Title>
      </Space>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div
            ref={dropZoneRef}
            style={{
              border: `2px dashed ${isDragOver ? '#1677ff' : '#d9d9d9'}`,
              padding: '40px',
              textAlign: 'center',
              borderRadius: '8px',
              background: isDragOver ? '#e6f4ff' : undefined,
              transition: 'border-color 0.15s ease, background 0.15s ease',
              userSelect: 'none',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
          >
            <Button icon={<FolderOpenOutlined />} onClick={handleSelectFile} size="large">
              选择媒体文件
            </Button>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">或直接把文件拖到这里</Text>
            </div>
            {inputPath && (
              <div style={{ marginTop: 16 }}>
                <Text strong>已选择: {inputPath.split('/').pop()}</Text>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>{inputPath}</Text>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Text>目标格式:</Text>
            <Select
              defaultValue="mp4"
              style={{ width: 120 }}
              onChange={setTargetFormat}
              disabled={isConverting}
            >
              {formats.map((fmt) => (
                <Option key={fmt} value={fmt}>
                  {fmt.toUpperCase()}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={handleConvert}
              loading={isConverting}
              disabled={!inputPath}
            >
              开始转换
            </Button>
          </div>

          {isConverting && (
            <div style={{ textAlign: 'center' }}>
              <Text>正在后台转换中... 请稍候</Text>
              <Progress percent={progress} status="active" />
            </div>
          )}

          {resultPath && (
            <Card title="转换结果" size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>文件已保存至: {resultPath.split('/').pop()}</Text>
                <Space>
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => {
                      setResultPath(null);
                      setInputPath(null);
                    }}
                  >
                    清除
                  </Button>
                </Space>
              </div>
            </Card>
          )}
          {!inputPath && !isConverting && !resultPath && (
            <Empty description="使用系统原生 FFmpeg 引擎，速度极快且支持后台运行" />
          )}
        </Space>
      </Card>
      <div style={{ marginTop: 24 }}>
        <Text type="secondary" italic>
          提示: 原生转换模式直接调用系统 FFmpeg，不再消耗浏览器资源，转换大型视频文件更快捷。请确保系统已安装 ffmpeg。
        </Text>
      </div>
    </div>
  );
};

export default MediaConverter;
