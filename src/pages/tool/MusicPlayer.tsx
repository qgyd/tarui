import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Space, Typography, List, Upload, message, Slider, Empty } from 'antd';
import { UploadOutlined, PlayCircleOutlined, PauseCircleOutlined, StepBackwardOutlined, StepForwardOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useNavigate } from 'react-router';

const { Title, Text } = Typography;

interface Track {
  id: string;
  name: string;
  url: string;
}

const MusicPlayer: React.FC = () => {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null;

  const handleUpload: UploadProps['beforeUpload'] = (file) => {
    const isAudio = file.type.startsWith('audio/');
    if (!isAudio) {
      message.error(`${file.name} 不是音频文件`);
      return Upload.LIST_IGNORE;
    }
    const url = URL.createObjectURL(file);
    const newTrack: Track = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url,
    };
    setTracks((prev) => [...prev, newTrack]);
    message.success(`${file.name} 已添加到播放列表`);
    return false; // 不上传到服务器
  };

  const playTrack = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (currentIndex === -1 && tracks.length > 0) {
      playTrack(0);
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrack(nextIndex);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrack(prevIndex);
  };

  const deleteTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const indexToDelete = tracks.findIndex((t) => t.id === id);
    if (indexToDelete === currentIndex) {
      setIsPlaying(false);
      setCurrentIndex(-1);
    } else if (indexToDelete < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    }
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSliderChange = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setProgress(value);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space align="center" style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tool')} />
        <Title level={2} style={{ margin: 0 }}>音乐播放器</Title>
      </Space>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Upload beforeUpload={handleUpload} showUploadList={false} accept="audio/*" multiple>
            <Button icon={<UploadOutlined />}>导入本地音乐</Button>
          </Upload>

          <div style={{ textAlign: 'center', background: '#f5f5f5', padding: '32px', borderRadius: '12px' }}>
            {currentTrack ? (
              <>
                <Title level={4}>{currentTrack.name}</Title>
                <Slider
                  value={progress}
                  max={duration}
                  onChange={handleSliderChange}
                  tooltip={{ formatter: (val) => formatTime(val || 0) }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text type="secondary">{formatTime(progress)}</Text>
                  <Text type="secondary">{formatTime(duration)}</Text>
                </div>
                <Space size="large">
                  <Button icon={<StepBackwardOutlined />} shape="circle" size="large" onClick={prevTrack} />
                  <Button
                    icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    shape="circle"
                    type="primary"
                    size="large"
                    style={{ width: 64, height: 64, fontSize: 32 }}
                    onClick={togglePlay}
                  />
                  <Button icon={<StepForwardOutlined />} shape="circle" size="large" onClick={nextTrack} />
                </Space>
                <audio
                  ref={audioRef}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={nextTrack}
                  style={{ display: 'none' }}
                />
              </>
            ) : (
              <Empty description="请先导入音乐文件" />
            )}
          </div>

          <Title level={4}>播放列表 ({tracks.length})</Title>
          <List
            bordered
            dataSource={tracks}
            renderItem={(item, index) => (
              <List.Item
                style={{ cursor: 'pointer', background: index === currentIndex ? '#e6f4ff' : 'transparent' }}
                onClick={() => playTrack(index)}
                actions={[
                  <Button
                    key="delete"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => deleteTrack(item.id, e)}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={index === currentIndex && isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  title={item.name}
                />
              </List.Item>
            )}
          />
        </Space>
      </Card>
    </div>
  );
};

export default MusicPlayer;
