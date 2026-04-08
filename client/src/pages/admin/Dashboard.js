import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, message } from 'antd';
import { 
  LogoutOutlined, 
  UserOutlined,
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  GiftOutlined,
  BarChartOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import Tasks from './Tasks';
import Users from './Users';
import Rewards from './Rewards';
import Statistics from './Statistics';
import { exportAPI } from '../../api';

const { Header, Sider, Content } = Layout;

function AdminDashboard({ user, onLogout }) {
  const [selectedMenu, setSelectedMenu] = useState('dashboard');

  const handleExport = async () => {
    try {
      const response = await exportAPI.toExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'points_system_data.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '数据概览' },
    { key: 'tasks', icon: <FileTextOutlined />, label: '任务管理' },
    { key: 'users', icon: <TeamOutlined />, label: '用户管理' },
    { key: 'rewards', icon: <GiftOutlined />, label: '奖励管理' },
    { key: 'statistics', icon: <BarChartOutlined />, label: '统计分析' },
  ];

  const userMenu = (
    <Menu>
      <Menu.Item key="export" icon={<DownloadOutlined />} onClick={handleExport}>
        导出Excel
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={onLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return <Statistics />;
      case 'tasks':
        return <Tasks />;
      case 'users':
        return <Users />;
      case 'rewards':
        return <Rewards />;
      case 'statistics':
        return <Statistics detailed />;
      default:
        return <Statistics />;
    }
  };

  return (
    <Layout className="dashboard-layout">
      <Sider width={240} theme="light">
        <div className="logo">🌟 积分系统</div>
        <Menu
          mode="inline"
          selectedKeys={[selectedMenu]}
          onClick={(e) => setSelectedMenu(e.key)}
          items={menuItems}
          style={{ height: 'calc(100% - 64px)', borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header className="dashboard-header">
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>
            {menuItems.find(item => item.key === selectedMenu)?.label || '管理后台'}
          </div>
          <Dropdown overlay={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <span>{user.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="dashboard-content">
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminDashboard;
