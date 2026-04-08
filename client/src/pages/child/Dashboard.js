import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, message } from 'antd';
import { 
  LogoutOutlined, 
  UserOutlined,
  HomeOutlined,
  FileTextOutlined,
  GiftOutlined,
  TrophyOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import Tasks from './Tasks';
import MyTasks from './MyTasks';
import Rewards from './Rewards';
import Profile from './Profile';
import { userAPI } from '../../api';

const { Header, Sider, Content } = Layout;

function ChildDashboard({ user, onLogout }) {
  const [selectedMenu, setSelectedMenu] = useState('home');
  const [userInfo, setUserInfo] = useState(user);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await userAPI.getById(user.id);
      setUserInfo(response.data);
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  };

  const handleRefresh = () => {
    fetchUserInfo();
    setRefreshKey(prev => prev + 1);
  };

  const menuItems = [
    { key: 'home', icon: <HomeOutlined />, label: '首页' },
    { key: 'tasks', icon: <FileTextOutlined />, label: '任务大厅' },
    { key: 'my-tasks', icon: <HistoryOutlined />, label: '我的任务' },
    { key: 'rewards', icon: <GiftOutlined />, label: '积分商城' },
    { key: 'profile', icon: <TrophyOutlined />, label: '我的成就' },
  ];

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={onLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const renderContent = () => {
    switch (selectedMenu) {
      case 'home':
        return <MyTasks user={userInfo} isHome onRefresh={handleRefresh} />;
      case 'tasks':
        return <Tasks onRefresh={handleRefresh} />;
      case 'my-tasks':
        return <MyTasks user={userInfo} onRefresh={handleRefresh} />;
      case 'rewards':
        return <Rewards user={userInfo} onRefresh={handleRefresh} />;
      case 'profile':
        return <Profile user={userInfo} onRefresh={handleRefresh} />;
      default:
        return <MyTasks user={userInfo} isHome onRefresh={handleRefresh} />;
    }
  };

  return (
    <Layout className="dashboard-layout">
      <Sider width={240} theme="light">
        <div className="logo">🌟 积分系统</div>
        <div style={{ padding: '16px', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', margin: '8px', borderRadius: '8px' }}>
          <Avatar size={64} icon={<UserOutlined />} style={{ marginBottom: 8 }} />
          <div style={{ color: 'white', fontWeight: 'bold' }}>{userInfo.name}</div>
          <div style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
            {userInfo.total_points} 分
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedMenu]}
          onClick={(e) => setSelectedMenu(e.key)}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header className="dashboard-header">
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>
            {menuItems.find(item => item.key === selectedMenu)?.label || '首页'}
          </div>
          <Dropdown overlay={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <span>{userInfo.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="dashboard-content" key={refreshKey}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default ChildDashboard;
