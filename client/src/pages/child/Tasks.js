import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, message, Modal, Input, Empty } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, StarOutlined } from '@ant-design/icons';
import { taskAPI } from '../../api';

const { TextArea } = Input;

function Tasks({ onRefresh }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleAccept = async (taskId) => {
    try {
      await taskAPI.accept(taskId);
      message.success('任务接取成功！');
      onRefresh();
    } catch (error) {
      message.error(error.response?.data?.error || '接取任务失败');
    }
  };

  const getTaskTypeColor = (type) => {
    const colors = {
      daily: '#1890ff',
      special: '#faad14',
      limited: '#f5222d',
      collection: '#52c41a',
    };
    return colors[type] || '#d9d9d9';
  };

  const getTaskTypeName = (type) => {
    const names = {
      daily: '日常任务',
      special: '特殊任务',
      limited: '限时任务',
      collection: '采集任务',
    };
    return names[type] || type;
  };

  return (
    <div>
      <Card title="📋 任务大厅" loading={loading}>
        <Row gutter={[16, 16]}>
          {tasks.length === 0 ? (
            <Col span={24}>
              <Empty description="暂无可用任务" />
            </Col>
          ) : (
            tasks.map((task) => (
              <Col xs={24} sm={12} lg={8} key={task.id}>
                <Card
                  className="task-card"
                  hoverable
                  onClick={() => {
                    setSelectedTask(task);
                    setModalVisible(true);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', marginBottom: 12 }}>
                    <span className="task-icon">{task.icon}</span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, marginBottom: 8 }}>{task.title}</h3>
                      <Tag color={getTaskTypeColor(task.type)}>
                        {getTaskTypeName(task.type)}
                      </Tag>
                    </div>
                    <div className="task-points">
                      {task.points} 分
                    </div>
                  </div>
                  <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                    {task.description}
                  </p>
                  {task.extra_bonus > 0 && (
                    <Tag color="orange" style={{ marginTop: 8 }}>
                      额外奖励 +{task.extra_bonus}
                    </Tag>
                  )}
                </Card>
              </Col>
            ))
          )}
        </Row>
      </Card>

      <Modal
        title={
          <div>
            <span style={{ fontSize: 24, marginRight: 8 }}>{selectedTask?.icon}</span>
            {selectedTask?.title}
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedTask(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setModalVisible(false);
            setSelectedTask(null);
          }}>
            取消
          </Button>,
          <Button 
            key="accept" 
            type="primary" 
            onClick={() => {
              handleAccept(selectedTask?.id);
              setModalVisible(false);
              setSelectedTask(null);
            }}
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
          >
            接取任务
          </Button>,
        ]}
      >
        {selectedTask && (
          <div>
            <p><strong>任务描述：</strong>{selectedTask.description}</p>
            <p><strong>任务类型：</strong>
              <Tag color={getTaskTypeColor(selectedTask.type)}>
                {getTaskTypeName(selectedTask.type)}
              </Tag>
            </p>
            <p><strong>基础积分：</strong>{selectedTask.points} 分</p>
            {selectedTask.extra_bonus > 0 && (
              <p><strong>额外奖励：</strong>{selectedTask.extra_bonus} 分</p>
            )}
            {selectedTask.time_limit && (
              <p><strong>时间限制：</strong>{selectedTask.time_limit} 分钟</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Tasks;
