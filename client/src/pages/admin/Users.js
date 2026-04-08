import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, Select, Space, 
  Tag, message, Popconfirm, InputNumber, Tabs 
} from 'antd';
import { PlusOutlined, TrophyOutlined, HistoryOutlined } from '@ant-design/icons';
import { userAPI } from '../../api';

const { Option } = Select;

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pointHistory, setPointHistory] = useState([]);
  const [form] = Form.useForm();
  const [adjustForm] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      await userAPI.register(values);
      message.success('用户创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await userAPI.delete(id);
      message.success('用户已删除');
      fetchUsers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleAdjustPoints = async (values) => {
    try {
      await userAPI.adjustPoints(selectedUser.id, values);
      message.success('积分调整成功');
      setAdjustModalVisible(false);
      adjustForm.resetFields();
      fetchUsers();
    } catch (error) {
      message.error('调整失败');
    }
  };

  const showPointHistory = async (userId) => {
    try {
      const response = await userAPI.getPointHistory(userId);
      setPointHistory(response.data.history);
    } catch (error) {
      message.error('获取积分历史失败');
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '孩子'}
        </Tag>
      ),
    },
    {
      title: '总积分',
      dataIndex: 'total_points',
      key: 'total_points',
      render: (points) => <Tag color="purple" style={{ fontSize: 14 }}>{points} 分</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setSelectedUser(record);
              setAdjustModalVisible(true);
            }}
          >
            调整积分
          </Button>
          <Button
            type="link"
            onClick={() => showPointHistory(record.id)}
          >
            积分历史
          </Button>
          {record.role !== 'admin' && (
            <Popconfirm
              title="确定要删除这个用户吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const historyColumns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      render: (points) => (
        <Tag color={points > 0 ? 'green' : 'red'}>
          {points > 0 ? '+' : ''}{points}
        </Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const types = {
          earn: '获得',
          spend: '消费',
          adjust: '调整',
        };
        return types[type] || type;
      },
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <div>
      <Card
        title="用户列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            新建用户
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新建用户"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ role: 'child' }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="登录用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="登录密码" />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="显示名称" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="child">孩子</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`调整积分 - ${selectedUser?.name}`}
        open={adjustModalVisible}
        onCancel={() => {
          setAdjustModalVisible(false);
          setSelectedUser(null);
          adjustForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={adjustForm}
          layout="vertical"
          onFinish={handleAdjustPoints}
        >
          <Form.Item
            name="points"
            label="调整积分（正数为增加，负数为减少）"
            rules={[{ required: true, message: '请输入积分' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="description"
            label="调整原因"
          >
            <Input.TextArea rows={3} placeholder="请说明调整原因" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认调整
              </Button>
              <Button onClick={() => {
                setAdjustModalVisible(false);
                setSelectedUser(null);
                adjustForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {pointHistory.length > 0 && (
        <Modal
          title="积分历史"
          open={pointHistory.length > 0}
          onCancel={() => setPointHistory([])}
          footer={null}
          width={800}
        >
          <Table
            columns={historyColumns}
            dataSource={pointHistory}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Modal>
      )}
    </div>
  );
}

export default Users;
