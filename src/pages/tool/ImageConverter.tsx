import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, Button, Space, Typography, Select, message, Slider, Checkbox, Empty, Row, Col } from 'antd';
import {
  PictureOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebview } from '@tauri-apps/api/webview';

const { Title, Text } = Typography;

type ImageFormat = 'png' | 'jpeg' | 'webp' | 'bmp';

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPG' },
  { value: 'webp', label: 'WEBP' },
  { value: 'bmp', label: 'BMP' },
];

const IMAGE_EXTS = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'svg', 'ico', 'tiff', 'tif',
]);

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  bmp: 'image/bmp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  tiff: 'image/tiff',
  tif: 'image/tiff',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getExtension(name: string): string {
  return (name.split('.').pop() ?? '').toLowerCase();
}

const ImageConverter: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const isPointerOverRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState(90);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [applyBgColor, setApplyBgColor] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ w: number; h: number; size?: string } | null>(null);

  const needsBgFill = applyBgColor || targetFormat === 'jpeg' || targetFormat === 'bmp';

  // ── helpers ──────────────────────────────────────────────

  const setImage = useCallback((img: HTMLImageElement, name: string, blobUrl: string, size?: number) => {
    setOriginalImage(img);
    setOriginalFileName(name);
    setPreviewUrl(blobUrl);
    setImageInfo({ w: img.naturalWidth, h: img.naturalHeight, size: size != null ? formatFileSize(size) : undefined });
    setResultUrl('');
    message.success(`已加载: ${name}`);
  }, []);

  const loadBlob = useCallback(
    (blob: Blob, name: string) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => setImage(img, name, url, blob.size);
      img.onerror = () => {
        URL.revokeObjectURL(url);
        message.error('图片加载失败');
      };
      img.src = url;
    },
    [setImage],
  );

  /** 通过 Tauri invoke 读取本地文件路径 → blob → Image */
  const loadFromPath = useCallback(
    async (filePath: string) => {
      const name = filePath.split('/').pop() ?? filePath;
      const ext = getExtension(name);
      if (!IMAGE_EXTS.has(ext)) {
        message.error('不支持的文件类型，请拖拽图片文件');
        return;
      }
      try {
        const bytes: number[] = await invoke('read_image_file', { path: filePath });
        const mime = MIME_MAP[ext] || 'image/png';
        const blob = new Blob([new Uint8Array(bytes)], { type: mime });
        loadBlob(blob, name);
      } catch (err) {
        message.error(`读取文件失败: ${err}`);
      }
    },
    [loadBlob],
  );

  // ── Tauri native drag-drop ──────────────────────────────

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    (async () => {
      try {
        unlisten = await getCurrentWebview().onDragDropEvent((event: any) => {
          const p = event?.payload;
          if (!p || !dropZoneRef.current) return;

          if (p.type === 'over') {
            const r = dropZoneRef.current.getBoundingClientRect();
            const pos = p.position;
            const inside =
              pos &&
              typeof pos.x === 'number' &&
              typeof pos.y === 'number' &&
              pos.x >= r.left && pos.x <= r.right &&
              pos.y >= r.top && pos.y <= r.bottom;
            isPointerOverRef.current = Boolean(inside);
            setIsDragOver(Boolean(inside));
          } else if (p.type === 'drop') {
            setIsDragOver(false);
            if (!isPointerOverRef.current) return;
            const paths: string[] = Array.isArray(p.paths) ? p.paths : [];
            if (paths[0]) loadFromPath(paths[0]);
          } else if (p.type === 'cancel') {
            isPointerOverRef.current = false;
            setIsDragOver(false);
          }
        });
      } catch {
        /* 非 Tauri 环境 */
      }
    })();

    return () => {
      isPointerOverRef.current = false;
      setIsDragOver(false);
      unlisten?.();
    };
  }, [loadFromPath]);

  // ── HTML5 drag-drop (fallback) ──────────────────────────

  const onHtmlDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) loadBlob(file, file.name);
    },
    [loadBlob],
  );

  // ── file input ──────────────────────────────────────────

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadBlob(file, file.name);
      e.target.value = '';
    },
    [loadBlob],
  );

  // ── live preview (bg color) ─────────────────────────────

  useEffect(() => {
    if (!originalImage || !previewCanvasRef.current) return;
    const c = previewCanvasRef.current;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const maxW = 600, maxH = 300;
    const scale = Math.min(1, maxW / originalImage.naturalWidth, maxH / originalImage.naturalHeight);
    c.width = Math.round(originalImage.naturalWidth * scale);
    c.height = Math.round(originalImage.naturalHeight * scale);

    ctx.clearRect(0, 0, c.width, c.height);
    if (needsBgFill) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.drawImage(originalImage, 0, 0, c.width, c.height);
  }, [originalImage, bgColor, needsBgFill]);

  // ── convert ─────────────────────────────────────────────

  const handleConvert = useCallback(() => {
    if (!originalImage || !canvasRef.current) {
      message.error('请先选择图片');
      return;
    }
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    c.width = originalImage.naturalWidth;
    c.height = originalImage.naturalHeight;
    ctx.clearRect(0, 0, c.width, c.height);

    if (needsBgFill) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.drawImage(originalImage, 0, 0);

    const mime = `image/${targetFormat}`;
    const q = (targetFormat === 'jpeg' || targetFormat === 'webp') ? quality / 100 : undefined;
    setResultUrl(c.toDataURL(mime, q));
    message.success('转换完成！');
  }, [originalImage, targetFormat, quality, bgColor, needsBgFill]);

  // ── download ────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const stem = originalFileName.split('.').slice(0, -1).join('.') || 'image';
    const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${stem}_converted.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resultUrl, originalFileName, targetFormat]);

  // ── clear ───────────────────────────────────────────────

  const handleClear = useCallback(() => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setOriginalImage(null);
    setOriginalFileName('');
    setPreviewUrl('');
    setResultUrl('');
    setImageInfo(null);
  }, [previewUrl]);

  // ── render ──────────────────────────────────────────────

  return (
    <div style={{ padding: '24px' }}>
      <Space align="center" style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tool')} />
        <Title level={2} style={{ margin: 0 }}>图片格式转换</Title>
      </Space>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">

          {/* ── 拖拽 / 选择区域 ── */}
          <div
            ref={dropZoneRef}
            style={{
              border: `2px dashed ${isDragOver ? '#1677ff' : '#d9d9d9'}`,
              padding: '40px',
              textAlign: 'center',
              borderRadius: 8,
              background: isDragOver ? '#e6f4ff' : undefined,
              transition: 'all .15s ease',
              userSelect: 'none',
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={onHtmlDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={onFileInput}
            />
            <Button icon={<FolderOpenOutlined />} onClick={() => fileInputRef.current?.click()} size="large">
              选择图片文件
            </Button>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">支持 PNG、JPG、WEBP、BMP、GIF 等格式，也可直接拖拽到此处</Text>
            </div>
            {originalFileName && (
              <div style={{ marginTop: 16 }}>
                <Text strong>已选择: {originalFileName}</Text>
                {imageInfo && (
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {imageInfo.w} × {imageInfo.h} px{imageInfo.size ? ` · ${imageInfo.size}` : ''}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 原图预览 ── */}
          {previewUrl && (
            <div style={{ textAlign: 'center' }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>原图预览</Text>
              <img
                src={previewUrl}
                alt="preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 8,
                  border: '1px solid #f0f0f0',
                  background: 'repeating-conic-gradient(#e0e0e0 0% 25%, transparent 0% 50%) 50% / 16px 16px',
                }}
              />
            </div>
          )}

          {/* ── 格式 & 质量 ── */}
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8}>
              <Space>
                <Text>目标格式:</Text>
                <Select
                  value={targetFormat}
                  style={{ width: 120 }}
                  onChange={(v) => setTargetFormat(v)}
                  options={FORMAT_OPTIONS}
                />
              </Space>
            </Col>
            {(targetFormat === 'jpeg' || targetFormat === 'webp') && (
              <Col xs={24} sm={16}>
                <Space>
                  <Text>质量:</Text>
                  <Slider min={10} max={100} value={quality} onChange={setQuality} style={{ width: 160 }} />
                  <Text style={{ minWidth: 40 }}>{quality}%</Text>
                </Space>
              </Col>
            )}
          </Row>

          {/* ── 底色设置 ── */}
          <Card
            size="small"
            title={<Space><BgColorsOutlined />底色设置</Space>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Checkbox checked={applyBgColor} onChange={(e) => setApplyBgColor(e.target.checked)}>
                应用自定义底色（替换透明区域）
              </Checkbox>
              {(targetFormat === 'jpeg' || targetFormat === 'bmp') && !applyBgColor && (
                <Text type="warning" style={{ fontSize: 12 }}>
                  JPG / BMP 不支持透明通道，透明区域将自动填充为所选底色
                </Text>
              )}
              <Space align="center">
                <Text>底色:</Text>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{
                    width: 40,
                    height: 32,
                    padding: 0,
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: 'none',
                  }}
                />
                <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 13 }}>{bgColor}</Text>
                <Space size={4} style={{ marginLeft: 8 }}>
                  {['#ffffff', '#000000', '#f5f5f5', '#ff4d4f', '#1677ff', '#52c41a', '#faad14', '#722ed1'].map((c) => (
                    <div
                      key={c}
                      onClick={() => setBgColor(c)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        backgroundColor: c,
                        border: bgColor === c ? '2px solid #1677ff' : '1px solid #d9d9d9',
                        cursor: 'pointer',
                        transition: 'border .15s',
                      }}
                    />
                  ))}
                </Space>
              </Space>
            </Space>
          </Card>

          {/* ── 底色实时预览 ── */}
          {originalImage && needsBgFill && (
            <div style={{ textAlign: 'center' }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>底色效果预览</Text>
              <canvas
                ref={previewCanvasRef}
                style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }}
              />
            </div>
          )}

          {/* ── 操作按钮 ── */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Button type="primary" icon={<PictureOutlined />} onClick={handleConvert} disabled={!originalImage} size="large">
              开始转换
            </Button>
            {resultUrl && (
              <Button icon={<DownloadOutlined />} onClick={handleDownload} size="large">
                下载结果
              </Button>
            )}
            {originalImage && (
              <Button icon={<DeleteOutlined />} danger onClick={handleClear} size="large">
                清除
              </Button>
            )}
          </div>

          {/* ── 转换结果 ── */}
          {resultUrl && (
            <Card title="转换结果" size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <div style={{ textAlign: 'center' }}>
                <img
                  src={resultUrl}
                  alt="result"
                  style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid #d9d9d9' }}
                />
              </div>
            </Card>
          )}

          {!originalImage && !resultUrl && (
            <Empty description="选择或拖拽图片，转换格式并自定义底色" />
          )}
        </Space>
      </Card>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ImageConverter;
