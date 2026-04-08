import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Empty, Tabs, Timeline, Badge } from 'antd';
import { TrophyOutlined, StarOutlined, FireOutlined, HistoryOutlined } from '@ant-design/icons';
import { userAPI } from '../../api';

const { TabPane } = Tabs;

function Profile({ user, onRefresh }) {
  const [achievements, setAchievements] = useState({ unlocked: [], all: [] });
  const [pointHistory, setPointHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [achievementsRes, historyRes] = await Promise.all([
        userAPI.getAchievements(user.id),
        userAPI.getPointHistory(user.id, { limit: 20 }),
      ]);
      setAchievements(achievementsRes.data);
      setPointHistory(historyRes.data.history);
    } catch (error) {
      console.error('获取数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const getConditionText = (type, value) => {
    const conditions = {
      tasks_completed: `完成 ${value} 个任务`,
      poems_memorized: `背诵 ${value} 首古诗`,
      study_streak: `连续学习 ${value} 天`,
      exercise_hours: `运动累计 ${value} 小时`,
      total_points: `累计获得 ${value} 积分`,
    };
    return conditions[type] || `${type}: ${value}`;
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
              <h2 style={{ margin: 0 }}>{user.name}</h2>
              <Tag color="blue" style={{ marginTop: 8 }}>孩子账号</Tag>
            </div>
          </Col>
          <Col span={18}>
            <Row gutter={16}>
              <Col span={8}>
                <div className="stat-card">
                  <StarOutlined style={{ fontSize: 24, color: '#667eea' }} />
                  <div style={{ color: '#666', marginTop: 8 }}>总积分</div>
                  <div className="stat-value">{user.total_points}</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="stat-card">
                  <TrophyOutlined style={{ fontSize: 24, color: '#faad14' }} />
                  <div style={{ color: '#666', marginTop: 8 }}>已获成就</div>
                  <div className="stat-value">{achievements.unlocked.length}</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="stat-card">
                  <FireOutlined style={{ fontSize: 24, color: '#f5222d' }} />
                  <div style={{ color: '#666', marginTop: 8 }}>待解锁成就</div>
                  <div className="stat-value">{achievements.all.length - achievements.unlocked.length}</div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="achievements">
        <TabPane 
          tab={
            <span>
              <TrophyOutlined />
              我的成就
            </span>
          } 
          key="achievements"
        >
          <Card loading={loading}>
            <Row gutter={[16, 16]}>
              {achievements.all.length === 0 ? (
                <Col span={24}>
                  <Empty description="暂无成就" />
                </Col>
              ) : (
                achievements.all.map((achievement) => {
                  const isUnlocked = achievements.unlocked.some(a => a.id === achievement.id);
                  
                  return (
                    <Col xs={24} sm={12} lg={8} key={achievement.id}>
                      <Card 
                        className="task-card"
                        style={{ 
                          opacity: isUnlocked ? 1 : 0.5,
                          background: isUnlocked ? 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)' : 'white'
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 48, marginBottom: 8 }}>
                            {isUnlocked ? achievement.icon : '🔒'}
                          </div>
                          <h3 style={{ margin: '8px 0' }}>{achievement.title}</h3>
                          <p style={{ color: '#666', marginBottom: 8 }}>{achievement.description}</p>
                          <Tag color={isUnlocked ? 'success' : 'default'}>
                            {getConditionText(achievement.condition_type, achievement.condition_value)}
                          </Tag>
                          {achievement.points_bonus > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <Tag color="gold">奖励 +{achievement.points_bonus} 积分</Tag>
                            </div>
                          )}
                          {isUnlocked && (
                            <div style={{ marginTop: 8, color: '#52c41a', fontSize: 12 }}>
                              ✓ 已解锁
                            </div>
                          )}
                        </div>
                      </Card>
                    </Col>
                  );
                })
              )}
            </Row>
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <HistoryOutlined />
              积分历史
            </span>
          } 
          key="history"
        >
          <Card loading={loading}>
            {pointHistory.length === 0 ? (
              <Empty description="暂无积分记录" />
            ) : (
              <Timeline>
                {pointHistory.map((record) => (
                  <Timeline.Item 
                    key={record.id}
                    color={record.points > 0 ? 'green' : 'red'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{record.description}</div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {new Date(record.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <Tag color={record.points > 0 ? 'green' : 'red'}>
                        {record.points > 0 ? '+' : ''}{record.points}
                      </Tag>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}

export default Profile;
