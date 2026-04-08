import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, Select, InputNumber, 
  Switch, Space, Tag, message, Popconfirm 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { taskAPI } from '../../api';

const { TextArea } = Input;
const { Option } = Select;

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await taskAPI.getAll();
      setTasks(response.data);
    } catch (error) {
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingTask) {
        await taskAPI.update(editingTask.id, values);
        message.success('任务更新成功');
      } else {
        await taskAPI.create(values);
        message.success('任务创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await taskAPI.delete(id);
      message.success('任务已删除');
      fetchTasks();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const openModal = (task = null) => {
    setEditingTask(task);
    if (task) {
      form.setFieldsValue(task);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const getTaskTypeTag = (type) => {
    const types = {
      daily: { color: 'blue', text: '日常任务' },
      special: { color: 'gold', text: '特殊任务' },
      limited: { color: 'red', text: '限时任务' },
      collection: { color: 'green', text: '采集任务' },
    };
    const config = types[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 60,
      render: (icon) => <span style={{ fontSize: 24 }}>{icon}</span>,
    },
    {
      title: '任务名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: getTaskTypeTag,
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      render: (points) => <Tag color="purple">{points} 分</Tag>,
    },
    {
      title: '额外奖励',
      dataIndex: 'extra_bonus',
      key: 'extra_bonus',
      render: (bonus) => bonus ? <Tag color="orange">+{bonus}</Tag> : '-',
    },
    {
      title: '完成次数',
      dataIndex: 'total_completed',
      key: 'total_completed',
      render: (count) => count || 0,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个任务吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="任务列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            新建任务
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTask(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: 'daily', points: 1, extra_bonus: 0, is_active: true }}
        >
          <Form.Item
            name="title"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="例如：打扫卫生" />
          </Form.Item>

          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} placeholder="详细描述任务内容" />
          </Form.Item>

          <Form.Item
            name="type"
            label="任务类型"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="daily">日常任务</Option>
              <Option value="special">特殊任务</Option>
              <Option value="limited">限时任务</Option>
              <Option value="collection">采集任务</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="points"
            label="基础积分"
            rules={[{ required: true, message: '请输入积分' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="extra_bonus" label="额外奖励积分">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="time_limit" label="时间限制（分钟）">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="留空表示无限制" />
          </Form.Item>

          <Form.Item name="icon" label="图标">
            <Input placeholder="例如：🧹" />
          </Form.Item>

          <Form.Item name="is_active" label="启用状态" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingTask ? '更新' : '创建'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingTask(null);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Tasks;
