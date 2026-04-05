import React, { useState, useEffect } from 'react';
import { Card, Button, Input, List, Space, Typography, Modal, message, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const Notebook: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem('notes', JSON.stringify(newNotes));
  };

  const handleAddNote = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setIsModalOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      message.warning('请输入标题或内容');
      return;
    }

    const now = new Date().toLocaleString();
    if (editingNote) {
      const updatedNotes = notes.map((n) =>
        n.id === editingNote.id ? { ...n, title, content, updatedAt: now } : n
      );
      saveNotes(updatedNotes);
      message.success('更新成功');
    } else {
      const newNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        title: title || '无标题',
        content,
        updatedAt: now,
      };
      saveNotes([newNote, ...notes]);
      message.success('已保存');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条笔记吗？',
      onOk: () => {
        const updatedNotes = notes.filter((n) => n.id !== id);
        saveNotes(updatedNotes);
        message.info('已删除');
      },
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space align="center">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tool')} />
          <Title level={2} style={{ margin: 0 }}>笔记本</Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNote}>
          新建笔记
        </Button>
      </div>

      {notes.length === 0 ? (
        <Empty description="还没有笔记，点击右上角新建一个吧" />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
          dataSource={notes}
          renderItem={(item) => (
            <List.Item>
              <Card
                title={item.title}
                extra={
                  <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEditNote(item)} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} />
                  </Space>
                }
                hoverable
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ flex: 1, overflow: 'hidden', marginBottom: 16 }}>
                  <Paragraph ellipsis={{ rows: 4 }}>{item.content || '无内容'}</Paragraph>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  更新于: {item.updatedAt}
                </Text>
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title={editingNote ? '编辑笔记' : '新建笔记'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Input
            placeholder="笔记标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ fontSize: '18px', fontWeight: 'bold' }}
          />
          <TextArea
            placeholder="开始记录..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            style={{ resize: 'none' }}
          />
        </Space>
      </Modal>
    </div>
  );
};

export default Notebook;
