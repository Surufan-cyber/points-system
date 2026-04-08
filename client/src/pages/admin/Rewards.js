import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, Select, InputNumber, 
  Switch, Space, Tag, message, Popconfirm, Tabs 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { rewardAPI } from '../../api';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

function Rewards() {
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rewardsRes, redemptionsRes] = await Promise.all([
        rewardAPI.getAll(),
        rewardAPI.getAllRedemptions(),
      ]);
      setRewards(rewardsRes.data);
      setRedemptions(redemptionsRes.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingReward) {
        await rewardAPI.update(editingReward.id, values);
        message.success('奖励更新成功');
      } else {
        await rewardAPI.create(values);
        message.success('奖励创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingReward(null);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await rewardAPI.delete(id);
      message.success('奖励已删除');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleFulfill = async (id) => {
    try {
      await rewardAPI.fulfill(id, {});
      message.success('已标记为完成');
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const openModal = (reward = null) => {
    setEditingReward(reward);
    if (reward) {
      form.setFieldsValue(reward);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const getCategoryTag = (category) => {
    const categories = {
      money: { color: 'gold', text: '金钱' },
      experience: { color: 'blue', text: '体验' },
      food: { color: 'green', text: '食物' },
      item: { color: 'purple', text: '物品' },
    };
    const config = categories[category] || { color: 'default', text: category };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const rewardColumns = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 60,
      render: (icon) => <span style={{ fontSize: 24 }}>{icon}</span>,
    },
    {
      title: '奖励名称',
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
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: getCategoryTag,
    },
    {
      title: '所需积分',
      dataIndex: 'points_required',
      key: 'points_required',
      render: (points) => <Tag color="purple">{points} 分</Tag>,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => stock === -1 ? '无限' : stock,
    },
    {
      title: '兑换次数',
      dataIndex: 'total_redemptions',
      key: 'total_redemptions',
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
            title="确定要删除这个奖励吗？"
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

  const redemptionColumns = [
    {
      title: '用户',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: '奖励',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <span>
          <span style={{ fontSize: 20, marginRight: 8 }}>{record.icon}</span>
          {title}
        </span>
      ),
    },
    {
      title: '消耗积分',
      dataIndex: 'points_spent',
      key: 'points_spent',
      render: (points) => <Tag color="orange">{points} 分</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'fulfilled' ? 'success' : 'processing'}>
          {status === 'fulfilled' ? '已兑现' : '待处理'}
        </Tag>
      ),
    },
    {
      title: '兑换时间',
      dataIndex: 'redeemed_at',
      key: 'redeemed_at',
      render: (time) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        record.status !== 'fulfilled' && (
          <Button
            type="link"
            icon={<CheckOutlined />}
            onClick={() => handleFulfill(record.id)}
          >
            标记完成
          </Button>
        )
      ),
    },
  ];

  return (
    <div>
      <Tabs defaultActiveKey="rewards">
        <TabPane tab="奖励列表" key="rewards">
          <Card
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
              >
                新建奖励
              </Button>
            }
          >
            <Table
              columns={rewardColumns}
              dataSource={rewards}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="兑换记录" key="redemptions">
          <Card>
            <Table
              columns={redemptionColumns}
              dataSource={redemptions}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={editingReward ? '编辑奖励' : '新建奖励'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingReward(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ category: 'experience', points_required: 50, stock: -1, is_active: true }}
        >
          <Form.Item
            name="title"
            label="奖励名称"
            rules={[{ required: true, message: '请输入奖励名称' }]}
          >
            <Input placeholder="例如：一日游" />
          </Form.Item>

          <Form.Item name="description" label="奖励描述">
            <TextArea rows={3} placeholder="详细描述奖励内容" />
          </Form.Item>

          <Form.Item
            name="category"
            label="奖励类别"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="money">金钱</Option>
              <Option value="experience">体验</Option>
              <Option value="food">食物</Option>
              <Option value="item">物品</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="points_required"
            label="所需积分"
            rules={[{ required: true, message: '请输入积分' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="stock" label="库存（-1表示无限）">
            <InputNumber min={-1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="icon" label="图标">
            <Input placeholder="例如：🎢" />
          </Form.Item>

          <Form.Item name="is_active" label="启用状态" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingReward ? '更新' : '创建'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingReward(null);
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

export default Rewards;
