import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { TrophyOutlined, StarOutlined, FireOutlined, TeamOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { userAPI, taskAPI } from '../../api';

function Statistics({ detailed = false }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPoints: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  const [userStats, setUserStats] = useState([]);
  const [taskTypeStats, setTaskTypeStats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, [detailed]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const usersRes = await userAPI.getAll();
      const users = usersRes.data;

      const totalPoints = users.reduce((sum, user) => sum + user.total_points, 0);

      setStats({
        totalUsers: users.length,
        totalPoints,
        totalTasks: 0,
        completedTasks: 0,
      });

      const sortedUsers = [...users].sort((a, b) => b.total_points - a.total_points);
      setUserStats(sortedUsers.slice(0, 10));

    } catch (error) {
      console.error('获取统计数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

  const userColumns = [
    {
      title: '排名',
      key: 'rank',
      render: (_, __, index) => (
        <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}>
          {index + 1}
        </Tag>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '总积分',
      dataIndex: 'total_points',
      key: 'total_points',
      render: (points) => <Tag color="purple">{points} 分</Tag>,
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={stats.totalUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总积分"
              value={stats.totalPoints}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#764ba2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={userStats.filter(u => u.total_points > 0).length}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#f5576c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="最高积分"
              value={userStats[0]?.total_points || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#f093fb' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="积分排行榜">
            <Table
              columns={userColumns}
              dataSource={userStats}
              rowKey="id"
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="积分分布">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userStats.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_points" name="积分" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {detailed && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="系统概览">
              <p>📊 系统运行正常</p>
              <p>👥 当前共有 {stats.totalUsers} 位用户</p>
              <p>⭐ 累计发放 {stats.totalPoints} 积分</p>
              <p>💡 建议：定期更新任务和奖励，保持孩子的积极性</p>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default Statistics;
