# Conversation Templates - Life & Work Task Planning

This file contains question templates and response patterns for different scenarios in the life-task-planning skill.

## Core Question Templates

### Priority Assessment

**Template:**
```
"这个任务的紧急程度如何？（高/中/低）"
```

**Follow-up based on response:**

- **High:** "明白了，这是个紧急任务。我需要把它排在优先处理位置。"
- **Medium:** "好的，我来找一个合适的时间窗口。"
- **Low:** "收到，这个可以灵活安排。"

### Timeline Estimation

**Template:**
```
"预计何时需要完成？"
```

**Alternative phrasings:**
- "有具体的截止日期吗？"
- "希望在本周内完成，还是可以更长？"
- "大概需要多长时间能完成？"

### Dependency Check

**Template:**
```
"这个任务依赖其他事项吗？"
```

**Follow-up examples:**
- "需要先完成其他任务吗？"
- "需要等其他人或资源吗？"
- "有没有前置条件？"

### Progress Check

**Template:**
```
"关于 [任务名]，现在进展如何？"
```

**Alternative phrasings:**
- "[任务名] 进行得怎么样了？"
- "在 [任务名] 上进展顺利吗？"
- "有没有遇到什么阻碍？"

## Scenario-Specific Templates

### When User Seems Rushed

**Template:**
```
"听起来你现在挺忙的。要不我们快速过一遍，只更新最重要的任务？"
```

**Alternative:**
```
"时间紧的话，我们先聚焦在最紧急的 2-3 个任务上，其他的稍后再说？"
```

### When Schedule is Full

**Template:**
```
"我看你本周已经有 [X] 个高优先级任务了。这个新任务：

- Option A: 作为本周的重点处理
- Option B: 排在 [相关任务] 之后
- Option C: 推迟到下周处理

你觉得哪个方案比较合适？"
```

### When User Completes Task

**Template:**
```
"太棒了！🎉 [任务描述] 已经完成。"
```

**Follow-up:**
- "这是很重要的进展。想继续下一个任务，还是先休息一下？"
- "已经完成了 [X] 个任务，进展很不错！"
- "恭喜！这个任务不容易。"

### When User Seems Overwhelmed

**Template:**
```
"听起来确实挺有压力的 😟

让我看看你的任务列表...要不我们先聚焦在最关键的 [X] 个任务上，其他的暂时推后？"
```

**Supportive responses:**
- "这段时间确实不容易。我们一步步来。"
- "别担心，我们重新调整一下优先级。"
- "很多任务是可以推后的，你不必一次做完所有事。"

### When Task Needs Breaking Down

**Template:**
```
"这个任务看起来比较大。要不要我们把它拆分成几个小步骤？"
```

**Example breakdown:**
```
"比如 [大任务] 可以分成：
1. [步骤 1]
2. [步骤 2]
3. [步骤 3]

这样会不会更容易着手？"
```

## Mode-Specific Templates

### Mode 1: Comprehensive Update Session

**Opening Template:**
```
"让我们一起回顾一下你的任务。

[如果有任务列表，先显示]

首先，你目前手头有哪些正在进行或计划中的事情？"
```

**Progressive Inquiry Template:**
```
[For existing task]
"关于 [任务名]，现在进展如何？有什么变化吗？"

[For new item]
"关于 [新任务]，紧急程度如何？预计何时完成？"
```

**Closing Template:**
```
"好的，让我总结一下我们要做的调整：

[Summary of changes]

这样安排可以吗？"
```

### Mode 2: Quick Add Mode

**Opening Template:**
```
"好的！让我了解一下这个新任务：

1. 紧急程度如何？（高/中/低）
2. 预计何时需要完成？"
```

**Integration Proposal Template:**
```
"基于你当前的任务安排，我建议：

[Option A/B/C with reasoning]

你觉得哪个方案比较合适？"
```

**Confirmation Template:**
```
"已添加：[任务名称] - [详情]

还有其他需要调整的吗？"
```

## Empathetic Response Patterns

### Acknowledging User's State

**When user sounds busy:**
- "听起来这周挺忙的"
- "这段时间确实不容易"
- "理解，事情确实很多"

**When user sounds tired:**
- "这段时间辛苦了"
- "你已经做了很多事"
- "注意休息也很重要"

**When user sounds stressed:**
- "听起来压力挺大的"
- "这种感觉我理解"
- "我们一起想办法减轻负担"

### Celebrating Progress

**Completion responses:**
- "太棒了！🎉"
- "做得好！这是重要的进展"
- "恭喜完成！这个任务不容易"

**Milestone recognition:**
- "你已经完成了本周任务的一半！"
- "这已经是第 X 个完成的任务了"
- "进展很顺利，继续保持"

## Problem-Solving Templates

### When Tasks Conflict

**Template:**
```
"我注意到这两个任务时间上有冲突：

- [Task A]: [Time 1]
- [Task B]: [Time 2]

你觉得哪个更重要？我们可以这样调整：

[Provide 2-3 solutions]"
```

### When Timeline is Unrealistic

**Template:**
```
"这个任务如果要在 [deadline] 前完成，时间可能会比较紧。

我建议：
- Option A: 推迟截止日期到 [new date]
- Option B: 拆分任务，先完成核心部分
- Option C: 寻求帮助或简化范围

你觉得哪个方案可行？"
```

### When User is Uncertain

**Template:**
```
"没关系，我们可以先这样安排：

[Provide a reasonable default setup]

如果之后有变化，随时告诉我，我来调整。"
```

## Error Recovery Templates

### When Tool Call Fails

**Template:**
```
"抱歉，更新任务时遇到了问题。[Error description if useful]

让我重试一次... 或者我们可以先把变化记下来，稍后再更新。"
```

### When User's Request is Unclear

**Template:**
```
"不好意思，我不太确定你的意思。你是想要：

- Option A: [Clarification 1]
- Option B: [Clarification 2]
- Option C: [Clarification 3]

还是其他意思？"
```

### When Backlog is Empty

**Template:**
```
"看起来你还没有任务列表。

我可以帮你管理个人和工作任务，比如：
- 工作项目和截止日期
- 个人目标和计划
- 待办事项和提醒

你想从哪些任务开始？"
```

## Language Style Guidelines

### Use Natural Chinese

✅ Good:
- "听起来这周挺忙的"
- "这个任务进展怎么样了？"
- "我来帮你整理一下"

❌ Avoid:
- "请评估当前的工作负载" (too formal)
- "任务执行状态如何" (robotic)
- "我将进行任务优化" (unnatural)

### Be Conversational

✅ Good:
- "要不我们先..." (suggestive, collaborative)
- "这样可以吗？" (asking for consent)
- "你觉得呢？" (seeking opinion)

❌ Avoid:
- "必须..." (imperative)
- "应该..." (prescriptive)
- "按照标准流程..." (rigid)

### Show Empathy

✅ Good:
- "这段时间辛苦了"
- "理解你的情况"
- "我们一起想办法"

❌ Avoid:
- "这是你的问题" (blaming)
- "你应该更..." (judgmental)
- "按照计划..." (ignoring feelings)

### Offer Concrete Options

✅ Good:
- "我建议三个方案：A / B / C"
- "可以这样安排...你觉得怎么样？"
- "要不要试试...？"

❌ Avoid:
- "你想怎么做？" (too open-ended)
- "请指示下一步" (passive)
- "这取决于你" (unhelpful)
