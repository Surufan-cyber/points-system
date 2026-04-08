# 微信小程序版本开发指南

## 📱 为什么开发小程序版本？

- ✅ 无需下载安装，孩子直接使用
- ✅ 可以发送模板消息提醒孩子完成任务
- ✅ 更好的移动端体验
- ✅ 可以分享给其他家庭使用

## 🛠️ 开发准备

### 1. 注册微信小程序

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 点击"立即注册" → 选择"小程序"
3. 填写账号信息（需要邮箱激活）
4. 完成主体信息登记（个人或企业）
5. 获取 AppID

### 2. 安装开发工具

下载地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 3. 技术选型

#### 方案一：原生小程序开发（推荐新手）
- 使用微信原生语法
- 学习成本低
- 性能最优

#### 方案二：使用 Taro（推荐）
- 可以复用现有 React 代码
- 一套代码多端运行
- 适合有 React 基础的开发者

```bash
# 安装 Taro CLI
npm install -g @tarojs/cli

# 创建项目
taro init points-system-mini

# 选择 React + TypeScript
```

#### 方案三：使用 uni-app
- Vue 语法
- 跨平台能力强

## 📋 功能规划

### 必须功能
- [x] 用户登录（微信授权）
- [x] 任务列表展示
- [x] 接取任务
- [x] 完成任务
- [x] 积分查看
- [x] 奖励兑换
- [x] 我的任务

### 增强功能
- [ ] 模板消息推送
- [ ] 任务提醒
- [ ] 积分变动通知
- [ ] 成就达成通知
- [ ] 分享功能

## 🔧 后端适配

### 1. 添加微信登录接口

```javascript
// server/routes/auth.js 添加

router.post('/wechat-login', async (req, res) => {
  const { code } = req.body;
  
  // 获取 openid 和 session_key
  const response = await axios.get(
    `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`
  );
  
  const { openid, session_key } = response.data;
  
  // 查找或创建用户
  let user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
  
  if (!user) {
    const result = db.prepare(
      'INSERT INTO users (username, password, name, role, openid) VALUES (?, ?, ?, ?, ?)'
    ).run(openid, '', '微信用户', 'child', openid);
    
    user = { id: result.lastInsertRowid, openid };
  }
  
  // 生成 token
  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  
  res.json({ token, user });
});
```

### 2. 数据库添加 openid 字段

```sql
ALTER TABLE users ADD COLUMN openid TEXT;
```

### 3. 配置服务器域名

在微信公众平台配置：
- 登录微信公众平台
- 开发 → 开发管理 → 开发设置 → 服务器域名
- 添加你的后端域名

## 📱 小程序页面结构

```
miniprogram/
├── pages/
│   ├── index/              # 首页
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── tasks/              # 任务大厅
│   ├── my-tasks/           # 我的任务
│   ├── rewards/            # 积分商城
│   └── profile/            # 个人中心
├── utils/
│   ├── api.js              # API 封装
│   └── util.js             # 工具函数
├── app.js
├── app.json
├── app.wxss
└── project.config.json
```

## 🎨 UI 设计建议

### 配色方案
- 主色：#667eea（渐变紫）
- 辅色：#764ba2
- 成功：#52c41a
- 警告：#faad14
- 错误：#f5222d

### 组件库推荐
- [Vant Weapp](https://youzan.github.io/vant-weapp/)（推荐）
- [WeUI](https://github.com/Tencent/weui-wxss)
- [ColorUI](https://github.com/weilanwl/ColorUI)

## 🚀 开发流程

### 第一阶段：基础功能（1-2周）
1. 搭建小程序项目
2. 实现微信登录
3. 任务列表展示
4. 接取和完成任务
5. 积分查看

### 第二阶段：核心功能（1周）
1. 奖励兑换
2. 我的任务
3. 积分历史
4. 成就系统

### 第三阶段：优化功能（1周）
1. 模板消息推送
2. 任务提醒
3. 性能优化
4. UI 美化

## 📝 模板消息配置

### 1. 申请模板消息

在微信公众平台：
- 功能 → 模板消息
- 选择合适的模板或自定义

### 2. 发送模板消息

```javascript
// 后端发送模板消息
const sendTemplateMessage = async (openid, templateId, data) => {
  const accessToken = await getAccessToken();
  
  await axios.post(
    `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`,
    {
      touser: openid,
      template_id: templateId,
      page: '/pages/index/index',
      data: {
        thing1: { value: '任务完成提醒' },
        thing2: { value: '打扫卫生' },
        number3: { value: '1' },
        time4: { value: new Date().toLocaleString() }
      }
    }
  );
};
```

## 🔐 安全注意事项

1. **服务器域名白名单**：必须配置合法域名
2. **HTTPS**：后端必须使用 HTTPS
3. **数据加密**：敏感数据需要加密传输
4. **用户隐私**：遵守微信小程序运营规范

## 💰 费用说明

- 小程序注册：免费（个人）
- 小程序认证：300元/年（企业，可选）
- 云服务器：50-100元/月
- 域名：50-100元/年
- SSL证书：免费（Let's Encrypt）

**总计：约 1000-1500元/年**

## 📚 学习资源

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Taro 文档](https://taro-docs.jd.com/)
- [Vant Weapp 文档](https://youzan.github.io/vant-weapp/)
- [微信小程序设计指南](https://developers.weixin.qq.com/miniprogram/design/)

## 🎯 下一步

1. 注册微信小程序账号
2. 安装开发工具
3. 选择开发方案（原生/Taro）
4. 开始开发
5. 测试和发布

祝开发顺利！🎉
