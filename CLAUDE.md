# AgentHive -- Claude Code 可视化多任务管控平台

## 定位

AgentHive 是 Claude Code 的可视化多任务管控平台。Agent 编排交给 Claude Code 自身（主 Agent + subAgent 模式），AgentHive 负责任务管理、worktree 生命周期、可视化监控、审批卡点、治理能力可视化和多项目管理。

## 技术栈

- 前端：React 19 + TypeScript + Vite
- 后端：Node.js + Express + TypeScript
- 数据库：SQLite（better-sqlite3）
- 实时通信：WebSocket
- 认证：JWT + bcrypt
- 包管理：npm workspaces（monorepo）

## 项目结构

```
AgentHive/
├── package.json              # monorepo 根
├── tsconfig.base.json        # 共享 TS 配置
├── ui-design-spec.md         # UI 设计规范（Agent 编码参考）
├── scripts/
│   └── dev.sh                # 一键启动前后端
├── shared/                   # 前后端共享类型
│   └── src/types/
│       ├── index.ts
│       ├── project.ts
│       ├── user.ts
│       ├── idea.ts
│       ├── task.ts
│       ├── session.ts
│       ├── message.ts
│       ├── subagent.ts
│       ├── notification.ts
│       └── settings.ts
├── server/                   # 后端
│   └── src/
│       ├── index.ts          # 入口（HTTP + WebSocket）
│       ├── app.ts            # Express 应用
│       ├── database/
│       │   ├── connection.ts
│       │   ├── migrate.ts
│       │   ├── run-migrate.ts
│       │   └── migrations/
│       │       ├── 001_initial.sql
│       │       └── 002_axial_coords.sql
│       ├── middleware/
│       │   └── auth.ts
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── projects.ts
│       │   ├── tasks.ts
│       │   ├── sessions.ts
│       │   └── settings.ts
│       └── websocket/
│           └── index.ts
└── client/                   # 前端
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── css-modules.d.ts
        ├── routes/
        │   ├── Login.tsx
        │   ├── Login.module.css
        │   ├── Setup.tsx
        │   ├── Setup.module.css
        │   └── Canvas.tsx
        ├── utils/
        │   └── hex.ts            # 六边形网格数学工具
        ├── components/
        │   ├── HexCanvas.tsx     # 画布核心（缩放平移）
        │   ├── HexCanvas.module.css
        │   ├── HexGrid.tsx       # 网格背景层
        │   ├── HexGrid.module.css
        │   ├── HexCell.tsx       # 通用蜂格容器
        │   ├── HexCell.module.css
        │   ├── TaskCell.tsx      # 任务蜂格
        │   ├── TaskCell.module.css
        │   ├── FunctionCell.tsx  # 功能蜂格
        │   ├── FunctionCell.module.css
        │   ├── LogoCell.tsx      # 中心 Logo
        │   ├── LogoCell.module.css
        │   ├── HoneyFill.tsx     # 蜜填充组件
        │   ├── HoneyFill.module.css
        │   ├── TopBar.tsx        # 顶栏
        │   ├── TopBar.module.css
        │   ├── ArchiveBar.tsx    # 归档栏
        │   ├── ArchiveBar.module.css
        │   ├── Toolbar.tsx       # 画布工具栏
        │   ├── Toolbar.module.css
        │   ├── ZoomControls.tsx  # 缩放控件
        │   ├── ZoomControls.module.css
        │   ├── DependencyLines.tsx # 依赖连线
        │   ├── DependencyLines.module.css
        │   ├── SidePanel.tsx     # L1 侧滑面板
        │   ├── SidePanel.module.css
        │   ├── SnapPreview.tsx   # 拖拽吸附预览
        │   ├── SnapPreview.module.css
        │   ├── StatusLegend.tsx  # 状态图例
        │   └── StatusLegend.module.css
        ├── hooks/
        │   └── useDrag.ts        # 拖拽吸附 hook
        ├── stores/
        └── styles/
            ├── variables.css
            ├── global.css
            └── animations.css
```

## 启动方式

```bash
npm install
npm run dev          # 一键启动前后端
npm run dev:server   # 单独启动后端（端口 3001）
npm run dev:client   # 单独启动前端（端口 5173）
npm run db:migrate   # 手动执行数据库迁移
```

## 数据库

SQLite 数据库文件位于 `data/agenthive.db`，启动时自动创建并执行迁移。当前 9 张表：users、projects、ideas、tasks、sessions、messages、subagent_records、notifications、settings。

## 需求文档

`/Users/aeoringas/AI_Storage/REQUIREMENTS_v5.md`（最新版本，v1-v4 为历史版本）

## 设计文档

- UI 设计规范：`ui-design-spec.md`（项目根目录，Agent 编码级参考，含色值/尺寸/动画参数/组件规格）

## 开发规范

本项目由开发框架仓库（ClaudeAgent）的主 Agent 通过 worktree 模式开发。遵循开发框架的 rules 和 skills 约束。
