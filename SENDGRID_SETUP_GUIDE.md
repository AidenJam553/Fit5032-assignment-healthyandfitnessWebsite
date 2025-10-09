# SendGrid Email Service 配置指南

本指南将帮助你配置 SendGrid API 服务，以便在管理员邮件中心发送带附件的邮件。

## 📋 目录

1. [注册 SendGrid 账户](#1-注册-sendgrid-账户)
2. [验证发件人邮箱](#2-验证发件人邮箱)
3. [创建 API Key](#3-创建-api-key)
4. [配置环境变量](#4-配置环境变量)
5. [测试邮件发送](#5-测试邮件发送)
6. [常见问题](#6-常见问题)

---

## 1. 注册 SendGrid 账户

### 步骤：

1. 访问 SendGrid 官网：https://sendgrid.com/
2. 点击 "Start for Free" 或 "Sign Up" 按钮
3. 填写注册信息：
   - Email（使用你的真实邮箱）
   - Password
   - Company Name（可以填写你的项目名称）
4. 完成邮箱验证
5. 填写额外信息（SendGrid 会要求提供一些公司信息）

### 免费计划：

- SendGrid 提供免费计划：**每天 100 封邮件**
- 对于开发和测试环境完全足够
- 无需信用卡即可开始使用

---

## 2. 验证发件人邮箱

**重要：** SendGrid 要求验证发件人邮箱，否则无法发送邮件。

### Single Sender Verification（单一发件人验证）- 推荐用于开发

1. 登录 SendGrid Dashboard
2. 在左侧菜单中，导航至：**Settings** → **Sender Authentication**
3. 找到 "**Single Sender Verification**" 部分
4. 点击 "**Get Started**" 或 "**Create New Sender**"
5. 填写发件人信息：

   ```
   From Name: Your Name or Company Name
   From Email Address: your-email@example.com (你要用作发件人的邮箱)
   Reply To: your-email@example.com (可以相同)
   Company Address: 填写地址信息
   Company City: 城市
   Company State: 州/省
   Company Zip Code: 邮编
   Company Country: 国家
   Nickname: 给这个发件人起个昵称（方便识别）
   ```

6. 点击 "**Create**"
7. SendGrid 会向你填写的邮箱发送验证邮件
8. **打开邮件并点击验证链接**
9. 验证成功后，该邮箱就可以作为发件人使用了

### Domain Authentication（域名验证）- 用于生产环境

如果你有自己的域名并计划在生产环境使用：

1. 导航至：**Settings** → **Sender Authentication**
2. 找到 "**Domain Authentication**" 部分
3. 点击 "**Get Started**"
4. 按照向导添加 DNS 记录到你的域名
5. 验证 DNS 记录

---

## 3. 创建 API Key

### 步骤：

1. 登录 SendGrid Dashboard
2. 在左侧菜单中，导航至：**Settings** → **API Keys**
3. 点击右上角的 "**Create API Key**" 按钮
4. 配置 API Key：

   - **API Key Name**: 给你的 API Key 起一个名字（例如：`fit5032-dev-key`）
   - **API Key Permissions**: 选择权限
     - 推荐选择：**Full Access**（完全访问）
     - 或者选择：**Restricted Access**，然后只给 "Mail Send" 权限

5. 点击 "**Create & View**"
6. **重要：** API Key 只会显示一次，务必立即复制保存！

   ```
   示例 API Key 格式：
   SG.xxxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   ```

7. 将 API Key 保存到安全的地方

---

## 4. 配置环境变量

### 在项目中配置

1. 在项目根目录创建 `.env` 文件（如果还没有）
2. 添加以下配置：

   ```bash
   # SendGrid Email Configuration
   SENDGRID_API_KEY=SG.your_actual_api_key_here
   SENDGRID_FROM_EMAIL=your-verified-email@example.com
   ```

   **注意：**
   - 将 `SG.your_actual_api_key_here` 替换为你在步骤 3 中创建的 API Key
   - 将 `your-verified-email@example.com` 替换为你在步骤 2 中验证的邮箱

3. **重要安全提示：**
   - 确保 `.env` 文件已添加到 `.gitignore` 中
   - 永远不要将 API Key 提交到 Git 仓库
   - 不要在客户端代码中使用 API Key（已在服务器端处理）

### 示例配置

```bash
# .env 文件完整示例

# SendGrid Configuration
SENDGRID_API_KEY=SG.abc123xyz789_your_actual_key_here
SENDGRID_FROM_EMAIL=admin@yourdomain.com

# 其他配置...
VITE_API_URL=http://localhost:5175/api
```

---

## 5. 测试邮件发送

### 启动服务器

确保你的后端服务器正在运行：

```bash
npm run server
# 或
npm run dev:full
```

### 通过管理员界面测试

1. 登录管理员账户
2. 导航至 "**Email Centre**"
3. 选择收件人或手动输入邮箱地址
4. 填写邮件主题和内容
5. （可选）添加附件
6. 点击 "**Send Email**"
7. 检查收件箱（包括垃圾邮件文件夹）

### 使用 API 直接测试

你也可以使用 curl 或 Postman 测试：

```bash
curl -X POST http://localhost:5175/api/admin/send-email \
  -F "to=recipient@example.com" \
  -F "subject=Test Email" \
  -F "text=This is a test email from SendGrid" \
  -F "attachments=@/path/to/file.pdf"
```

---

## 6. 常见问题

### ❌ 错误：403 Forbidden

**原因：** API Key 权限不足或无效

**解决方法：**
1. 检查 API Key 是否正确复制
2. 确认 API Key 有 "Mail Send" 权限
3. 尝试创建新的 API Key 并使用 Full Access

### ❌ 错误：Sender email not verified

**原因：** 发件人邮箱未验证

**解决方法：**
1. 检查 `SENDGRID_FROM_EMAIL` 环境变量
2. 确认该邮箱已在 SendGrid 中验证（步骤 2）
3. 检查验证邮件是否已点击确认链接

### ❌ 错误：SendGrid is not configured

**原因：** 环境变量未正确设置

**解决方法：**
1. 确认 `.env` 文件存在于项目根目录
2. 检查环境变量名称拼写是否正确
3. 重启服务器以加载新的环境变量

### 📧 邮件未收到

**可能原因：**
1. 邮件在垃圾邮件文件夹
2. 收件人邮箱地址错误
3. SendGrid 账户被暂停（新账户可能需要人工审核）

**检查方法：**
1. 查看 SendGrid Dashboard → Activity
2. 检查邮件发送状态和投递记录
3. 查看服务器日志确认是否有错误

### 🔒 免费账户限制

- 每天最多 100 封邮件
- 如果超出限制，SendGrid 会返回错误
- 可以在 Dashboard 中查看当前配额使用情况

---

## 📚 附加资源

### SendGrid 官方文档

- [SendGrid API 文档](https://docs.sendgrid.com/api-reference)
- [Node.js SDK](https://github.com/sendgrid/sendgrid-nodejs)
- [单一发件人验证指南](https://docs.sendgrid.com/ui/sending-email/sender-verification)

### 发送邮件最佳实践

1. **使用有意义的主题行**
2. **提供明确的发件人信息**
3. **包含取消订阅链接**（生产环境）
4. **避免垃圾邮件词汇**（如 "FREE", "URGENT" 等）
5. **控制发送频率**

---

## 🎯 总结

完成以上步骤后，你的应用就可以使用 SendGrid 发送邮件了！

**快速检查清单：**

- ✅ 已注册 SendGrid 账户
- ✅ 已验证发件人邮箱
- ✅ 已创建并保存 API Key
- ✅ 已在 `.env` 文件中配置环境变量
- ✅ 已重启服务器
- ✅ 可以成功发送测试邮件

如果遇到问题，请参考 [常见问题](#6-常见问题) 部分或查看服务器日志。

---

**创建日期：** 2025-10-09  
**作者：** FIT5032 Project Team

