# Claude Code Skills

> 为 Claude Code 打造的可复用技能包，涵盖聊天机器人、CI/CD、云函数、UI 调试等多个开发场景。

## 安装

### 推荐: npx skills（自动管理）

```bash
# 安装单个 skill
npx skills add wenjiaqi8255/skills --skill chatbot-stack
npx skills add wenjiaqi8255/skills --skill supabase-mcp-oauth

# 安装所有 skills
npx skills add wenjiaqi8255/skills --all

# 更新已安装的 skills
npx skills update
```

### 手动安装

```bash
git clone https://github.com/wenjiaqi8255/skills.git
cp -r skills/<skill-name> ~/.claude/skills/
```

## 技能列表

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| [chatbot-stack](./chatbot-stack/) | 聊天机器人架构（AI 流式响应、会话管理、事件日志） | "build a chatbot", "chat API", "streaming AI" |
| [cicd-setup](./cicd-setup/) | CI/CD 流水线配置（GitHub Actions + Cloudflare Pages） | "set up CI/CD", "configure GitHub Actions" |
| [cloudflare-workers-oauth](./cloudflare-workers-oauth/) | Google OAuth on Cloudflare Workers（Auth.js + Drizzle + D1 + Hono） | "Google OAuth", "Auth.js", "sign in" |
| [cloudflare-workers-react](./cloudflare-workers-react/) | Cloudflare Workers + React 开发 | "Cloudflare Workers", "Workers + React" |
| [credit-bar](./credit-bar/) | 个人品牌 credit bar 组件（编辑风格页脚 + 社交链接） | "add credit bar", "personal branding footer" |
| [github-pages-deploy](./github-pages-deploy/) | GitHub Pages 部署（Vite、React、CI/CD、404 修复） | "deploy to GitHub Pages", "GitHub Pages CI/CD" |
| [ios-ci](./ios-ci/) | iOS GitHub Actions CI 配置（SPM 缓存、模拟器选择、gitignored 文件处理） | "set up CI for iOS", "GitHub Actions Xcode" |
| [life-task-planning](./life-task-planning/) | 生活/工作任务管理（backlog.md） | "更新任务", "add task", "review todos" |
| [share-image-generation](./share-image-generation/) | 社交分享图片生成（html2canvas + QR） | "share image", "capture DOM" |
| [supabase-mcp-oauth](./supabase-mcp-oauth/) | MCP Server + OAuth 2.1 on Supabase（PKCE relay、Apple/Google 登录、RLS） | "MCP server with OAuth", "MCP PKCE flow" |
| [ui-debug](./ui-debug/) | UI/CSS 问题系统性调试 | "debug CSS", "UI bug", "layout issue" |
| [zeabur-deploy-debug](./zeabur-deploy-debug/) | Zeabur 部署调试（Dockerfile、npm update 问题、日志分析） | "debug Zeabur", "deployment failed" |

## 仓库结构

```
my-skills/
├── chatbot-stack/
│   ├── SKILL.md              # 核心文档（必需）
│   └── references/           # 详细参考文档
├── cicd-setup/
│   ├── SKILL.md
│   ├── references/
│   └── assets/
├── skills.sh.json            # skills.sh 分类配置（可选）
└── ...
```

每个 Skill 遵循统一结构：`SKILL.md`（含 YAML frontmatter）+ 可选的 `references/`、`scripts/`、`assets/` 目录。

## 添加新 Skill

1. 在根目录下创建新目录
2. 添加 `SKILL.md`，包含 `name` 和 `description` frontmatter
3. 可选添加 `references/`、`scripts/`、`assets/`
4. 提交并推送

## 更新日志

- **2026-06-05**: 迁移到 npx skills 分发格式，移除 .skill 文件
- **2026-04-20**: 新增 supabase-mcp-oauth（MCP Server + OAuth 2.1 on Supabase Edge Functions）
- **2026-04-18**: 新增 cloudflare-workers-oauth（Google OAuth on Cloudflare Workers）
- **2026-04-01**: 新增 github-pages-deploy（GitHub Pages 部署）
- **2026-03-31**: 新增 credit-bar（个人品牌 credit bar 组件）
- **2026-03-30**: 新增 ios-ci（iOS GitHub Actions CI）、zeabur-deploy-debug（Zeabur 部署调试）
- **2026-03-24**: 新增 5 个 skills（chatbot-stack, cicd-setup, cloudflare-workers-react, share-image-generation, ui-debug）
- **2026-01-25**: 初始 life-task-planning skill

---

**维护者**: Wen Jiaqi
**许可证**: MIT
