# 🍌 Gemini Nano Banana Plus

基于 Google Gemini 2.5 Flash Image Preview 模型打造的精美 AI 图像生成与编辑 Web 应用，使用 Next.js 构建。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xianyu110/gemini-nanobanana-plus)

## ✨ 功能特性

### 🎨 AI 图像生成
- **文生图**：通过文字描述生成图像
- **图像编辑**：上传图片后通过自然语言对话进行编辑
- **多种风格**：增强细节、艺术风格、动漫风格、写实风格
- **批量生成**：一次生成 1-4 张图片

### 🎯 用户体验
- **精美界面**：现代化暗色主题，渐变背景搭配流畅动画
- **响应式设计**：完美适配桌面端和移动端
- **实时预览**：即时反馈和加载动画
- **多模式切换**：上传模式和文生图模式自由切换

### 🔧 技术特性
- **Next.js 14**：服务端渲染和 API 路由
- **TypeScript**：类型安全开发
- **多模型支持**：
  - **Gemini 2.5 Flash**：Google 最新 AI 图像生成模型
  - **OpenAI GPT Image 2**：支持 OpenAI Images API 协议的文生图与单图编辑
  - **Doubao SeedReam 4.0**：字节跳动高级图像生成模型
- **Vercel 部署**：优化的一键部署方案

## 🚀 快速开始

### 前置要求
- Node.js 18+
- AI 模型 API 密钥：
  - **Gemini API 密钥**：从 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取
  - **OpenAI API 密钥**：从 Chatfire 或 OpenAI 兼容平台获取
  - **Doubao API 密钥**：从 Chatfire 或兼容平台获取

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/xianyu110/gemini-nanobanana-plus.git
   cd gemini-nanobanana-plus
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   ```
   编辑 `.env.local` 并填入你的 API 密钥：
   ```env
   GEMINI_API_KEY=你的_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash-image
   MAYNOR_API_KEY=你的_chatfire_api_key
   MAYNOR_API_URL=https://api.chatfire.site
   MAYNOR_API_PROTOCOL=standard

   OPENAI_API_KEY=你的_chatfire_api_key
   OPENAI_API_URL=https://api.chatfire.site
   OPENAI_IMAGE_MODEL=gpt-image-2
   ```

   注意：
   - 当前默认统一使用 `https://api.chatfire.site`
   - `OPENAI_API_URL` 填基础地址，不要带 `/v1`
   - 项目会自动请求 `/v1/images/generations` 和 `/v1/images/edits`
   - 页面中的 OpenAI `API URL` 留空时，后端优先使用 `.env.local` 中的 `OPENAI_API_URL`
   - `MAYNOR_API_URL` 必须填写真实 API 基础地址，不能填写 Apifox 文档页地址
   - 如果你填的是完整接口地址，如 `https://api.chatfire.site/v1/chat/completions`，后端会自动还原为基础地址
   - `MAYNOR_API_PROTOCOL=standard` 表示 MAYNOR/Gemini 路径统一走标准 `/v1/chat/completions`

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **打开浏览器**
   访问 [http://localhost:3000](http://localhost:3000)

## 🌐 部署到 Vercel

### 一键部署
点击上方的 Vercel 按钮即可直接部署。

### 手动部署

1. **Fork 本仓库**

2. **导入 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 导入你 Fork 的仓库

3. **配置环境变量**
   在 Vercel 项目设置中添加：
   ```
   GEMINI_API_KEY=你的_api_key
   ```

4. **部署**
   Vercel 会自动构建并部署你的项目

## 🎯 使用指南

### 页面说明
- **主应用**：`/nano` - 完整功能的 Nano Banana 界面
- **演示版**：`/mvp` - 简化演示版本
- **首页**：`/` - 落地页

### AI 模型选择
支持三种 AI 模型：
- **🤖 Gemini 2.5 Flash**：Google 最新多模态 AI 模型
- **🖼️ OpenAI GPT Image 2**：OpenAI Images API 协议，支持文生图与单图编辑
- **🎨 Doubao SeedReam 4.0**：字节跳动高级图像生成模型

### 文生图
1. 选择「文生图模式」
2. 选择 AI 模型（Gemini、OpenAI 或 Doubao）
3. 输入中文或英文描述
4. 选择风格（增强、艺术、动漫、写实）
5. 选择生成图片数量（1-4 张）
6. 点击「开始生成」

### 图像编辑
1. 选择「通过对话编辑图像」模式
2. 选择 AI 模型（Gemini、OpenAI 或 Doubao）
3. 上传图片（支持 PNG、JPG、WebP）
4. 描述你想要的修改内容
5. 选择风格并生成

### OpenAI GPT Image 2 调用说明

#### 页面调用
1. 打开 `/nano`
2. 在模型选择区切换到 `OpenAI GPT Image 2`
3. 点击右上角 `API 配置`
4. 填入：
   - `API Key`
   - `API URL`
5. 直接生成或编辑图片

#### 后端接口调用
项目新增了 OpenAI 图片代理接口：

```text
POST /api/openai-image
```

#### 文生图请求示例

```bash
curl -X POST http://localhost:3000/api/openai-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只坐在窗台上的橘猫，午后阳光，写实摄影风格",
    "model": "gpt-image-2"
  }'
```

#### 图生图请求示例

```bash
curl -X POST http://localhost:3000/api/openai-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "把背景改成星空，增加蓝色霓虹光效",
    "model": "gpt-image-2",
    "imageData": "base64图片内容"
  }'
```

#### 请求规则
- 文生图走 OpenAI Images API 的 `/v1/images/generations`
- 图生图走 OpenAI Images API 的 `/v1/images/edits`
- 当前 OpenAI 编辑模式仅支持单图输入
- 如果不在请求体中传 `apiKey`、`apiUrl`，后端会自动读取 `.env.local`

### MAYNOR 第三方标准模型接入说明

当前项目默认统一接入 `https://api.chatfire.site`。如果你准备把 `MAYNOR_API_URL` 切换到其他第三方平台，请先确认你拿到的是“真实 API 基础地址”，不是 Apifox 文档页面。

错误示例：

```env
MAYNOR_API_URL=https://apifire.apifox.cn/380004201e0
```

上面这个是文档页地址，不能直接调用。

正确做法是填写第三方平台给你的真实接口基址，例如：

```env
MAYNOR_API_KEY=你的第三方平台_key
MAYNOR_API_URL=https://your-third-party-api-host
MAYNOR_API_PROTOCOL=standard
GEMINI_MODEL=nano-banana
```

以你给的 Chatfire 为例，推荐这样配置：

```env
MAYNOR_API_KEY=你的_chatfire_key
MAYNOR_API_URL=https://api.chatfire.site
MAYNOR_API_PROTOCOL=standard
GEMINI_MODEL=nano-banana
```

如果你手里只有完整接口地址，下面这种写法现在也能工作：

```env
MAYNOR_API_URL=https://api.chatfire.site/v1/chat/completions
```

请求规则：
- `MAYNOR_API_PROTOCOL=standard`
  - 文生图和图生图都走标准 `/v1/chat/completions`
  - 适合只兼容标准模型协议的第三方平台

你提供的 Chatfire 示例请求体与当前 `standard` 模式兼容，模型名可通过 `GEMINI_MODEL` 指定，例如：
- `nano-banana`
- `gemini-2.5-flash-image`
- `gemini-2.5-flash-image-preview`
- `nano-banana-pro`
- `nano-banana-pro_4k`

### 示例提示词
- "一只可爱的橘猫坐在彩虹桥上，梦幻风格，柔和光线"
- "A cute orange cat sitting on a rainbow bridge, dreamy style, soft lighting"
- "将这张图片转换为油画风格，增加温暖色调"

## 🛠️ 开发

### 项目结构
```
gemini-nano-banana/
├── app/
│   ├── api/
│   │   ├── gemini/          # Gemini API 端点
│   │   ├── openai-image/    # OpenAI 图片 API 端点
│   │   ├── generate/        # 备用生成端点
│   │   └── generate-demo/   # 演示端点
│   ├── nano/                # 主应用页面
│   ├── mvp/                 # MVP 演示页面
│   └── layout.tsx           # 根布局
├── public/                  # 静态资源
├── .env.example            # 环境变量模板
├── vercel.json            # Vercel 部署配置
└── README.md              # 项目文档
```

### 可用脚本
- `npm run dev` - 启动开发服务器
- `npm run build` - 生产环境构建
- `npm run start` - 启动生产服务器

### API 端点
- `/api/gemini` - Gemini 2.5 Flash 图像生成 API
- `/api/openai-image` - OpenAI GPT Image 2 图像生成 / 单图编辑 API
- `/api/doubao` - Doubao SeedReam 4.0 图像生成 API
- `/api/generate` - 备用生成端点
- `/api/generate-demo` - 演示端点

## 🔑 环境变量

| 变量 | 说明 | 是否必需 |
|------|------|----------|
| `GEMINI_API_KEY` | Google AI Studio 的 Gemini API 密钥 | ✅ |
| `GEMINI_MODEL` | Gemini/MAYNOR 路由使用的模型名，默认 `gemini-2.5-flash-image` | 使用第三方标准模型时建议配置 |
| `OPENAI_API_KEY` | OpenAI/Chatfire 图片接口使用的 API 密钥 | 使用 OpenAI 时必需 |
| `OPENAI_API_URL` | OpenAI/Chatfire 基础地址，不要带 `/v1`，默认 `https://api.chatfire.site` | 使用 OpenAI 时建议配置 |
| `OPENAI_IMAGE_MODEL` | OpenAI 图片模型名称，默认 `gpt-image-2` | 可选 |
| `MAYNOR_API_KEY` | Chatfire / MAYNOR 标准模型接口使用的 API 密钥 | 使用 Doubao 或第三方 MAYNOR 时必需 |
| `MAYNOR_API_URL` | MAYNOR / Chatfire 真实 API 基础地址，不能填 Apifox 文档页，默认 `https://api.chatfire.site` | 使用 Doubao 或第三方 MAYNOR 时必需 |
| `MAYNOR_API_PROTOCOL` | `standard` 或 `hybrid`，推荐 `standard` | 使用第三方 MAYNOR 时建议配置 |
| `STRIPE_SECRET_KEY` | Stripe 服务端密钥，构建支付接口时需要 | 如启用支付则必需 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 前端公钥 | 如启用支付则必需 |

## 🌟 界面特性

### 🍌 Nano Banana 界面
- **现代暗色主题**：护眼的渐变背景设计
- **流畅动画**：悬停效果和加载动画
- **响应式布局**：桌面端和移动端完美适配
- **交互元素**：增强的按钮、输入框和卡片

### 视觉效果
- **渐变卡片**：精美的背景渐变
- **发光效果**：微妙的阴影和光晕
- **平滑过渡**：全局 0.3s 缓动过渡
- **加载状态**：旋转齿轮图标和脉冲动画

## 📝 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

## 🤝 参与贡献

欢迎贡献！请随时提交 Pull Request。

## 💡 支持

如果遇到任何问题或有疑问：
1. 查看 [Issues](https://github.com/xianyu110/gemini-nanobanana-plus/issues) 页面
2. 创建新 Issue 并附上详细信息
3. 加入我们的社区讨论

## 🌟 致谢

- [Google Gemini](https://gemini.google.com) - 强大的 AI 模型
- [Next.js](https://nextjs.org) - 优秀的框架
- [Vercel](https://vercel.com) - 无缝部署平台

---

**使用 Google Gemini 2.5 Flash Image Preview 用心制作 ❤️**
