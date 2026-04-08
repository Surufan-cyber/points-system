import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, message, Modal, Input, Tabs, Empty, Progress } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, StarOutlined, TrophyOutlined } from '@ant-design/icons';
import { taskAPI } from '../../api';

const { TextArea } = Input;
const { TabPane } = Tabs;

function MyTasks({ user, isHome = false, onRefresh }) {
  const [pendingTasks, setPendingTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [proof, setProof] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchStatistics();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const [pendingRes, completedRes] = await Promise.all([
        taskAPI.getMyTasks('pending'),
        taskAPI.getMyTasks('completed'),
      ]);
      setPendingTasks(pendingRes.data);
      setCompletedTasks(completedRes.data);
    } catch (error) {
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await taskAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('获取统计失败', error);
    }
  };

  const handleComplete = async () => {
    try {
      const response = await taskAPI.complete(selectedTask.id, { proof });
      message.success(`任务完成！获得 ${response.data.pointsEarned} 积分`);
      setCompleteModalVisible(false);
      setSelectedTask(null);
      setProof('');
      fetchTasks();
      fetchStatistics();
      onRefresh();
    } catch (error) {
      message.error('完成任务失败');
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'blue', text: '进行中' },
      completed: { color: 'green', text: '已完成' },
      in_progress: { color: 'orange', text: '进行中' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  if (isHome) {
    return (
      <div>
        <div className="points-display">
          <div style={{ fontSize: 16 }}>我的积分</div>
          <div className="points-value">{user.total_points}</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            今日完成 {statistics.todayCompleted || 0} 个任务
          </div>
        </div>

        <Card title="📊 我的数据" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <div className="stat-card">
                <div style={{ color: '#666' }}>总完成任务</div>
                <div className="stat-value">{statistics.totalCompleted || 0}</div>
              </div>
            </Col>
            <Col span={8}>
              <div className="stat-card">
                <div style={{ color: '#666' }}>今日完成</div>
                <div className="stat-value">{statistics.todayCompleted || 0}</div>
              </div>
            </Col>
            <Col span={8}>
              <div className="stat-card">
                <div style={{ color: '#666' }}>总积分</div>
                <div className="stat-value">{user.total_points}</div>
              </div>
            </Col>
          </Row>
        </Card>

        <Card 
          title="📝 进行中的任务" 
          extra={<Button type="link" onClick={() => window.location.reload()}>刷新</Button>}
        >
          {pendingTasks.length === 0 ? (
            <Empty description="暂无进行中的任务" />
          ) : (
            <Row gutter={[16, 16]}>
              {pendingTasks.slice(0, 3).map((task) => (
                <Col span={24} key={task.id}>
                  <Card size="small" className="task-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 20, marginRight: 8 }}>{task.icon}</span>
                        <span style={{ fontWeight: 'bold' }}>{task.title}</span>
                      </div>
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => {
                          setSelectedTask(task);
                          setCompleteModalVisible(true);
                        }}
                      >
                        完成
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card>

        <Modal
          title="完成任务"
          open={completeModalVisible}
          onOk={handleComplete}
          onCancel={() => {
            setCompleteModalVisible(false);
            setSelectedTask(null);
            setProof('');
          }}
          okText="确认完成"
          cancelText="取消"
        >
          <p><strong>任务：</strong>{selectedTask?.title}</p>
          <p><strong>积分：</strong>{selectedTask?.points_earned || selectedTask?.points} 分</p>
          <div style={{ marginTop: 16 }}>
            <strong>完成证明（可选）：</strong>
            <TextArea
              rows={4}
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="描述一下你是如何完成任务的..."
            />
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <Tabs defaultActiveKey="pending">
        <TabPane tab={`进行中 (${pendingTasks.length})`} key="pending">
          <Card loading={loading}>
            {pendingTasks.length === 0 ? (
              <Empty description="暂无进行中的任务" />
            ) : (
              <Row gutter={[16, 16]}>
                {pendingTasks.map((task) => (
                  <Col xs={24} sm={12} lg={8} key={task.id}>
                    <Card className="task-card">
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontSize: 24, marginRight: 8 }}>{task.icon}</span>
                        <span style={{ fontSize: 16, fontWeight: 'bold' }}>{task.title}</span>
                      </div>
                      <p style={{ color: '#666', marginBottom: 12 }}>{task.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Tag color="blue">{task.points_earned || task.points} 分</Tag>
                        <Button 
                          type="primary" 
                          onClick={() => {
                            setSelectedTask(task);
                            setCompleteModalVisible(true);
                          }}
                        >
                          完成任务
                        </Button>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </TabPane>

        <TabPane tab={`已完成 (${completedTasks.length})`} key="completed">
          <Card loading={loading}>
            {completedTasks.length === 0 ? (
              <Empty description="暂无已完成的任务" />
            ) : (
              <Row gutter={[16, 16]}>
                {completedTasks.map((task) => (
                  <Col xs={24} sm={12} lg={8} key={task.id}>
                    <Card className="task-card">
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontSize: 24, marginRight: 8 }}>{task.icon}</span>
                        <span style={{ fontSize: 16, fontWeight: 'bold' }}>{task.title}</span>
                      </div>
                      <p style={{ color: '#666', marginBottom: 12 }}>{task.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Tag color="green">{task.points_earned} 分</Tag>
                          {task.bonus_earned > 0 && <Tag color="orange">+{task.bonus_earned}</Tag>}
                        </div>
                        <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
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
        title="完成任务"
        open={completeModalVisible}
        onOk={handleComplete}
        onCancel={() => {
          setCompleteModalVisible(false);
          setSelectedTask(null);
          setProof('');
        }}
        okText="确认完成"
        cancelText="取消"
      >
        <p><strong>任务：</strong>{selectedTask?.title}</p>
        <p><strong>积分：</strong>{selectedTask?.points_earned || selectedTask?.points} 分</p>
        <div style={{ marginTop: 16 }}>
          <strong>完成证明（可选）：</strong>
          <TextArea
            rows={4}
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            placeholder="描述一下你是如何完成任务的..."
          />
        </div>
      </Modal>
    </div>
  );
}

export default MyTasks;
