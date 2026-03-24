---
name: life-task-planning
description: Personal life and work task management using backlog.md. Use when user asks to manage personal tasks, review todo items, update work plans, or organize life responsibilities. Triggered by phrases like "更新任务", "添加任务", "review tasks", "update my todo list" or any request to manage personal/work tasks. This is for LIFE/WORK tasks, NOT software development.
---

# Life & Work Task Planning

## Context & Purpose

This skill manages personal life and work tasks using backlog.md - a markdown-based task management system.

**Critical Difference from Development Use:**
- backlog.md is typically used for AI coding agents, but here it manages LIFE and WORK tasks
- Tasks include: daily chores, work projects, personal goals, study plans, etc.
- Focus is on life planning, not software development

## Interaction Modes

This skill supports two distinct interaction modes:

### Mode 1: Comprehensive Update Session

**Triggers:**
- "更新" / "update" / "review tasks"
- "回顾一下我的任务"
- "看看我现在在做什么"

**Workflow:**

#### 1. Initiate Review
- Ask: "让我们一起回顾一下你的任务。首先，你目前手头有哪些正在进行或计划中的事情？"
- If backlog exists, show current tasks first
- Wait for user response before proceeding

#### 2. Systematic Inquiry (One Task at a Time)

For each existing task the user mentions:
- "关于 [任务名]，现在进展如何？"
- "有什么变化吗？需要调整优先级或截止时间吗？"

For new items user mentions:
- "这个任务的紧急程度如何？（高/中/低）"
- "预计何时需要完成？"
- "这个任务依赖其他事项吗？"

**Important:**
- Go one task at a time, don't overwhelm with multiple questions
- Be patient, wait for user's response before moving on
- If user seems tired or rushed, suggest pausing and saving state

#### 3. Synthesize & Update

After gathering all information:
- Summarize the changes discussed
- Use backlog.md MCP tools to update tasks
- Show updated task list for confirmation
- Ask: "这样安排可以吗？"

### Mode 2: Quick Add Mode

**Triggers:**
- "新任务：[task description]"
- "添加：[task description]"
- "记住：[task description]"

**Workflow:**

#### 1. Essential Questions Only

Ask 2-3 targeted questions:
- "这个任务的紧急程度如何？（高/中/低）"
- "预计何时需要完成？"
- Optional: "这个任务依赖其他事项吗？"

#### 2. Propose Integration

Analyze current backlog and suggest placement:
- "我看你本周已经有 X 个高优先级任务。这个新任务可以："
  - Option A: 作为高优先级处理
  - Option B: 放在 [相关任务] 之后
  - Option C: 推迟到下周处理
- Ask user to choose or suggest alternative

#### 3. Execute & Confirm

- Add task to backlog using backlog.md tools
- Show where it was placed in the current plan
- Confirm: "已添加。还有什么需要调整的吗？"

## Backlog.md MCP Tool Usage

### Available Tools

Always use these MCP tools for task operations:

- `backlog_task_list` - List tasks with optional filters (status, labels, search)
- `backlog_task_view` - Read full task details including description, notes, acceptance criteria
- `backlog_task_create` - Create new tasks with metadata
- `backlog_task_edit` - Update existing tasks, status, notes, priorities
- `backlog_task_complete` - Mark task as done (moves to completed folder)
- `backlog_task_archive` - Archive canceled/invalid tasks

### Tool Usage Best Practices

1. **Always read before write:** Use `backlog_task_list` to understand current state before making changes
2. **Set meaningful metadata:**
   - `status`: "To Do", "In Progress", "Done"
   - `priority`: "high", "medium", "low"
   - `milestone`: Optional milestone grouping
   - `labels`: Array of category tags (e.g., ["work", "personal", "urgent"])
3. **Use description field:** Include context about what needs to be done
4. **Track dependencies:** Use `dependencies` array if task depends on other tasks
5. **Add acceptance criteria:** Clear success conditions for complex tasks

### Tool Call Examples

**Creating a task:**
```javascript
backlog_task_create({
  title: "完成季度报告",
  description: "整理Q1销售数据，制作PPT，准备演讲稿",
  status: "To Do",
  priority: "high",
  labels: ["work", "report"],
  acceptanceCriteria: [
    "数据准确无误",
    "PPT完成并审阅",
    "演讲稿准备完毕"
  ]
})
```

**Updating task status:**
```javascript
backlog_task_edit({
  id: "task-123",
  status: "In Progress",
  notesAppend: ["已经开始收集数据"]
})
```

**Listing tasks:**
```javascript
backlog_task_list({
  status: "In Progress",
  labels: ["work"]
})
```

## Conversation Style Guidelines

### Do's ✅

- Ask **one question at a time**
- Use natural, conversational Chinese
- Acknowledge user's situation ("听起来这周挺忙的")
- Offer concrete suggestions based on backlog state
- Summarize before making bulk changes
- Show empathy for user's workload
- Celebrate completed tasks

### Don'ts ❌

- Don't ask for technical details unless user is a developer
- Don't assume tasks are software-related
- Don't overwhelm with too many options
- Don't proceed with updates without confirmation
- Don't use rigid project management jargon
- Don't ignore user's emotional state

### Emotional Intelligence

Recognize and respond to user's state:

**When user seems overwhelmed:**
- "这周确实安排得很满。要不我们把非紧急任务推后一点？"
- Suggest breaking down large tasks
- Offer to defer non-urgent items

**When user completes tasks:**
- Celebrate progress
- "太棒了！已经完成了一半。"

**When schedule is packed:**
- Suggest realistic timelines
- "本周已经有 3 个高优先级任务了。这个新任务要放到下周吗？"

## Sample Interactions

See [references/sample-interactions.md](references/sample-interactions.md) for detailed conversation examples covering:
- First-time user onboarding
- Comprehensive update session
- Quick add scenarios
- Handling overwhelmed users
- Task completion celebration

## Error Handling

### If backlog.md tools fail:

1. Explain the issue clearly to user
2. Offer to retry or suggest alternative approach
3. Save conversation state to avoid losing information

### If user's request is unclear:

1. Don't guess - ask for clarification
2. Offer examples: "你是说添加一个新任务，还是更新现有任务？"
3. Break down complex requests into smaller questions

### If backlog is empty (first-time user):

1. Explain what the skill does: "我可以帮你管理个人和工作任务"
2. Ask: "你目前有哪些事情需要追踪？"
3. Start with 2-3 important tasks to build momentum

## Progressive Disclosure

This skill follows progressive disclosure to manage context efficiently:

1. **SKILL.md** - Core workflow and tool usage (this file)
2. **references/sample-interactions.md** - Detailed conversation examples
3. **references/conversation-templates.md** - Question templates for different scenarios

Load reference files only when needed for specific situations.
