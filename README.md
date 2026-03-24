# Claude Code 自定义 Skills 集合

> 为 Claude Code 打造的可复用技能包，涵盖聊天机器人、CI/CD、云函数、UI 调试等多个开发场景。

## 技能列表

| Skill | 用途 | 触发关键词 |
|-------|------|-----------|
| [chatbot-stack](./chatbot-stack/) | 聊天机器人架构（AI 流式响应、会话管理、事件日志） | "build a chatbot", "chat API", "streaming AI" |
| [cicd-setup](./cicd-setup/) | CI/CD 流水线配置（GitHub Actions + Cloudflare Pages） | "set up CI/CD", "configure GitHub Actions" |
| [cloudflare-workers-react](./cloudflare-workers-react/) | Cloudflare Workers + React 开发 | "Cloudflare Workers", " Workers + React" |
| [share-image-generation](./share-image-generation/) | 社交分享图片生成（html2canvas + QR） | "share image", "capture DOM" |
| [ui-debug](./ui-debug/) | UI/CSS 问题系统性调试 | "debug CSS", "UI bug", "layout issue" |
| [life-task-planning](./life-task-planning/) | 生活/工作任务管理（backlog.md） | "更新任务", "add task", "review todos" |

## 使用方法

### 方式 1: 克隆到本地

```bash
git clone https://github.com/wenjiaqi8255/skills.git ~/.claude/skills
```

### 方式 2: 复制单个 Skill

```bash
# 只复制某个 skill
cp -r skills/chatbot-stack ~/.claude/skills/
```

### 触发 Skill

在 Claude Code 中输入触发词即可自动加载对应技能：

```
build a chatbot → chatbot-stack 自动加载
set up CI/CD → cicd-setup 自动加载
debug CSS → ui-debug 自动加载
```

## Skill 结构规范

每个 Skill 遵循统一的目录结构：

```
skill-name/
├── SKILL.md              # 核心文档（必需）
├── references/           # 详细参考文档
│   └── *.md
├── scripts/              # 可执行脚本（可选）
│   └── *.sh / *.py
└── assets/               # 静态资源（可选）
    └── *.yml / *.json
```

### SKILL.md 结构

- **YAML frontmatter**: 包含 `name` 和 `description`
- **触发描述**: 第三人称描述，列出具体触发短语
- **核心内容**: 快速参考、模式、示例
- **引用**: 指向 references/ 目录的链接

## 添加新 Skill

1. 在 `~/.claude/skills/` 下创建新目录
2. 添加 `SKILL.md`（必需）
3. 可选添加 `references/`、`scripts/`、`assets/`
4. 测试触发是否正常工作

## 更新日志

- **2026-03-24**: 新增 5 个 skills（chatbot-stack, cicd-setup, cloudflare-workers-react, share-image-generation, ui-debug）
- **2026-01-25**: 初始 life-task-planning skill

## 相关链接

- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code)
- [Skill 开发指南](https://docs.anthropic.com/en/docs/claude-code/extendable-extensions/skills)

---

**维护者**: Wen Jiaqi
**许可证**: MIT