import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, message, Modal, Empty, Tabs } from 'antd';
import { GiftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { rewardAPI } from '../../api';

const { TabPane } = Tabs;

function Rewards({ user, onRefresh }) {
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rewardsRes, redemptionsRes] = await Promise.all([
        rewardAPI.getAll(),
        rewardAPI.getMyRedemptions(),
      ]);
      setRewards(rewardsRes.data);
      setRedemptions(redemptionsRes.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId) => {
    try {
      const response = await rewardAPI.redeem(rewardId);
      message.success(`兑换成功！消耗 ${response.data.pointsSpent} 积分`);
      setModalVisible(false);
      setSelectedReward(null);
      fetchData();
      onRefresh();
    } catch (error) {
      message.error(error.response?.data?.error || '兑换失败');
    }
  };

  const getCategoryName = (category) => {
    const names = {
      money: '金钱',
      experience: '体验',
      food: '食物',
      item: '物品',
    };
    return names[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      money: 'gold',
      experience: 'blue',
      food: 'green',
      item: 'purple',
    };
    return colors[category] || 'default';
  };

  return (
    <div>
      <Tabs defaultActiveKey="mall">
        <TabPane tab="🎁 积分商城" key="mall">
          <Card loading={loading}>
            <Row gutter={[16, 16]}>
              {rewards.length === 0 ? (
                <Col span={24}>
                  <Empty description="暂无可用奖励" />
                </Col>
              ) : (
                rewards.map((reward) => {
                  const canRedeem = user.total_points >= reward.points_required && 
                                   (reward.stock === -1 || reward.stock > 0);
                  
                  return (
                    <Col xs={24} sm={12} lg={8} xl={6} key={reward.id}>
                      <div className="reward-card">
                        <div className="reward-icon">{reward.icon}</div>
                        <h3 style={{ margin: '8px 0' }}>{reward.title}</h3>
                        <p style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
                          {reward.description}
                        </p>
                        <Tag color={getCategoryColor(reward.category)}>
                          {getCategoryName(reward.category)}
                        </Tag>
                        <div style={{ margin: '12px 0' }}>
                          <Tag color="purple" style={{ fontSize: 16, padding: '4px 12px' }}>
                            {reward.points_required} 积分
                          </Tag>
                        </div>
                        {reward.stock !== -1 && (
                          <div style={{ marginBottom: 8, color: '#999' }}>
                            库存: {reward.stock}
                          </div>
                        )}
                        <Button
                          type="primary"
                          block
                          disabled={!canRedeem}
                          onClick={() => {
                            setSelectedReward(reward);
                            setModalVisible(true);
                          }}
                          style={{ 
                            background: canRedeem ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d9d9d9',
                            border: 'none'
                          }}
                        >
                          {canRedeem ? '立即兑换' : '积分不足'}
                        </Button>
                      </div>
                    </Col>
                  );
                })
              )}
            </Row>
          </Card>
        </TabPane>

        <TabPane tab="📋 我的兑换" key="history">
          <Card loading={loading}>
            {redemptions.length === 0 ? (
              <Empty description="暂无兑换记录" />
            ) : (
              <Row gutter={[16, 16]}>
                {redemptions.map((redemption) => (
                  <Col xs={24} sm={12} lg={8} key={redemption.id}>
                    <Card className="task-card">
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 48 }}>{redemption.icon}</span>
                      </div>
                      <h3 style={{ textAlign: 'center', marginBottom: 8 }}>{redemption.title}</h3>
                      <p style={{ color: '#666', textAlign: 'center', marginBottom: 12 }}>
                        {redemption.description}
                      </p>
                      <div style={{ textAlign: 'center' }}>
                        <Tag color="orange">{redemption.points_spent} 积分</Tag>
                        <Tag color={redemption.status === 'fulfilled' ? 'success' : 'processing'}>
                          {redemption.status === 'fulfilled' ? '已兑现' : '待处理'}
                        </Tag>
                      </div>
                      <div style={{ textAlign: 'center', marginTop: 8, color: '#999', fontSize: 12 }}>
                        {new Date(redemption.redeemed_at).toLocaleString('zh-CN')}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="确认兑换"
        open={modalVisible}
        onOk={() => handleRedeem(selectedReward?.id)}
        onCancel={() => {
          setModalVisible(false);
          setSelectedReward(null);
        }}
        okText="确认兑换"
        cancelText="取消"
      >
        {selectedReward && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{selectedReward.icon}</div>
            <h2>{selectedReward.title}</h2>
            <p>{selectedReward.description}</p>
            <div style={{ marginTop: 24 }}>
              <p>所需积分：<Tag color="purple">{selectedReward.points_required} 分</Tag></p>
              <p>当前积分：<Tag color="blue">{user.total_points} 分</Tag></p>
              <p>兑换后积分：<Tag color="orange">{user.total_points - selectedReward.points_required} 分</Tag></p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Rewards;
