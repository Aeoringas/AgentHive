# AgentHive UI 设计规范

> 面向 Agent 的编码级设计文档。所有色值、尺寸、动画参数可直接用于实现。

---

## 1. 设计原则

- **蜂巢即结构**：同心蜂巢径向布局，不是装饰性六边形贴图
- **暖黄贯穿**：从背景到组件，色温统一在蜂蜜/琥珀/蜡色光谱内
- **蜜填充即进度**：蜂格内的琥珀色液面高度直接表达任务进度，减少文字依赖
- **活跃居中，完成归档**：画布只保留活跃任务（3 层环），已完成任务封蜡后收入归档区

---

## 2. 色彩系统

所有颜色通过 CSS 变量定义在 `:root`，组件中引用变量而非硬编码色值。

### 2.1 基础色板

```css
:root {
  /* -- 背景 -- */
  --bg-base: #FFFDF7;           /* 页面底色，暖白 */
  --bg-subtle: #FFF8E8;         /* 次级背景，奶油色 */
  --bg-muted: #FFF0D0;          /* 弱调背景，浅蜜色 */

  /* -- 蜂蜜色阶（主色） -- */
  --honey-50: #FFFBEB;
  --honey-100: #FEF3C7;
  --honey-200: #FDE68A;
  --honey-300: #FCD34D;
  --honey-400: #FBBF24;
  --honey-500: #F59E0B;          /* 主蜂蜜色 */
  --honey-600: #D97706;
  --honey-700: #B45309;
  --honey-800: #92400E;
  --honey-900: #78350F;

  /* -- 蜡色（边框、空蜂格） -- */
  --wax-light: #F5E6C8;
  --wax: #E8D5A8;
  --wax-dark: #C9B07A;

  /* -- 文字 -- */
  --text-primary: #3D2E0A;       /* 深棕，主文字 */
  --text-secondary: #7A6B4E;     /* 中棕，次文字 */
  --text-muted: #A89B7E;         /* 浅棕，辅助文字 */
  --text-inverse: #FFFDF7;       /* 反色文字（深色背景上） */

  /* -- 状态色 -- */
  --status-running: #F59E0B;     /* 琥珀，运行中 */
  --status-reviewing: #A855F7;   /* 暖紫，审查中 */
  --status-waiting: #D4B896;     /* 暖灰棕，待执行 */
  --status-completed: #65A30D;   /* 暖橄榄绿，已完成 */
  --status-intervention: #DC2626;/* 警示红，需介入 */
  --status-interrupted: #9CA3AF; /* 中灰，已中断 */
  --status-paused: #E8A708;      /* 浅琥珀，已暂停 */
  --status-conflict: #EA580C;    /* 暖橙，冲突解决中 */

  /* -- 表面（玻璃效果） -- */
  --surface-card: rgba(255, 253, 247, 0.85);
  --surface-panel: rgba(255, 250, 240, 0.92);
  --surface-header: rgba(255, 248, 232, 0.80);
  --surface-overlay: rgba(120, 53, 15, 0.3);   /* 遮罩层 */

  /* -- 阴影（暖色调） -- */
  --shadow-sm: 0 1px 3px rgba(120, 53, 15, 0.06);
  --shadow-md: 0 4px 12px rgba(120, 53, 15, 0.08);
  --shadow-lg: 0 8px 32px rgba(120, 53, 15, 0.10);
  --shadow-glow: 0 0 20px rgba(245, 158, 11, 0.15); /* 蜂蜜光晕 */

  /* -- 边框 -- */
  --border-light: rgba(201, 176, 122, 0.2);
  --border-default: rgba(201, 176, 122, 0.35);
  --border-strong: rgba(180, 83, 9, 0.4);
}
```

### 2.2 状态色与环的映射

| 环 | 状态 | 主色 | 蜜填充色 | 边框色 |
|----|------|------|---------|--------|
| Ring 2 | 运行中 | --status-running | --honey-400 渐变到 --honey-600 | --honey-600 |
| Ring 3 | 审查中 | --status-reviewing | --honey-200 渐变到 --honey-400 | --status-reviewing |
| Ring 4 | 待执行 | --status-waiting | 无填充 | --wax |
| 归档区 | 已完成 | --status-completed | --honey-500 实填 | --wax-dark |
| 任意环 | 需介入 | --status-intervention | --honey-400 + 红色脉冲边框 | --status-intervention |
| 任意环 | 已中断 | --status-interrupted | 当前液面冻结，灰色叠加 | --status-interrupted |

---

## 3. 字体与排版

```css
:root {
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 28px;

  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  --leading-tight: 1.25;
  --leading-normal: 1.5;

  --tracking-tight: -0.01em;
  --tracking-normal: 0;
}
```

**使用规则：**
- 蜂格内任务名：--text-sm / --weight-semibold / --leading-tight，最多 2 行
- 蜂格内阶段描述：--text-xs / --weight-normal / --text-muted
- 面板标题：--text-base / --weight-bold
- 页面大标题：--text-2xl / --weight-bold
- 代码/日志：--font-mono / --text-xs

---

## 4. 间距系统

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```

---

## 5. 布局架构：同心蜂巢

### 5.1 坐标系统

采用 **axial 坐标系（q, r）** 替代当前的 offset 坐标系（col, row），更适合径向布局。

```
坐标系定义（pointy-top 六边形）：
- q 轴：水平偏右
- r 轴：左下方向
- 隐含 s 轴：s = -q - r

像素坐标转换：
  x = HEX_SIZE * (sqrt(3) * q + sqrt(3)/2 * r)
  y = HEX_SIZE * (3/2 * r)

环距离计算：
  distance(q, r) = max(|q|, |r|, |q + r|)

Ring N = 所有 distance = N 的蜂格
Ring N 的蜂格数 = N == 0 ? 1 : 6 * N
```

### 5.2 蜂格尺寸

```css
:root {
  --hex-size: 56px;             /* 外接圆半径，比当前 52px 略大 */
  --hex-width: 97px;            /* sqrt(3) * 56 ≈ 96.99 */
  --hex-height: 112px;          /* 2 * 56 */
  --hex-gap: 4px;               /* 蜂格间距 */
  --hex-logo-scale: 1.3;        /* Logo 蜂格放大系数 */
}
```

### 5.3 环定义

```
Ring 0  -- Logo（1 格）
Ring 1  -- 功能蜂格（6 格，固定角位）
Ring 2  -- 运行中任务（最多 12 格）
Ring 3  -- 审查中任务（最多 18 格）
Ring 4  -- 待执行任务（最多 24 格）
```

**Ring 1 功能蜂格角位分配：**

```
方向（axial 坐标）    功能
(1, 0)    0°        对话
(0, 1)    60°       文件
(-1, 1)   120°      Skill
(-1, 0)   180°      设置
(0, -1)   240°      提交
(1, -1)   300°      用量
```

**环溢出策略：** 当某环任务数超过容量时，多出的任务放入外侧相邻环的空位。例如运行中任务超过 12 个，溢出到 Ring 3 的空位，但保持运行中的视觉标识（蜜填充色不变）。

### 5.4 画布结构

```
全屏视口
├── 顶栏（固定，48px）
└── 画布区域（flex: 1）
    ├── 无限画布（可缩放平移）
    │   ├── 蜂巢网格背景（淡蜡色六边形描边）
    │   ├── Ring 0: Logo 蜂格
    │   ├── Ring 1: 功能蜂格 x6
    │   ├── Ring 2-4: 任务蜂格
    │   └── 依赖连线层（SVG overlay）
    ├── 归档栏（固定底部，可折叠）
    ├── L1 侧滑面板（固定右侧）
    ├── 工具栏（固定右上）
    ├── 缩放控件（固定右下）
    ├── 小地图（固定左下）
    └── 状态图例（固定左上，顶栏下方）
```

---

## 6. 组件规格

### 6.1 Logo 蜂格（Ring 0）

- 位置：axial (0, 0)，画布正中心
- 尺寸：--hex-size * --hex-logo-scale = 72.8px 外接圆
- 填充：径向渐变 --honey-500 -> --honey-700
- 文字："AH"，--text-xl，--weight-bold，--text-inverse
- 动画：呼吸脉冲（opacity 0.85 <-> 1.0），周期 3s，ease-in-out
- 阴影：--shadow-glow
- 不可点击，不可拖拽

### 6.2 功能蜂格（Ring 1）

- 位置：Ring 1 的 6 个固定角位
- 尺寸：标准 --hex-size
- 默认态：
  - 填充：--bg-subtle
  - 边框：2px --wax
  - 文字：功能名称，--text-sm，--weight-medium，--text-secondary
- Hover 态：
  - 填充：--honey-100
  - 边框：2px --honey-400
  - 阴影：--shadow-md
  - transform: scale(1.06)，transition 0.15s ease
- 点击：打开对应 L2 浮层
- 可拖拽到其他空位（自动整理时复位）

### 6.3 任务蜂格（Ring 2-4）

**结构：**

```
<svg 六边形 clip-path>
  <蜜填充层>        -- 底部向上填充，高度 = 进度百分比
  <边框>            -- 状态对应色
</svg>
<内容层>
  <任务名称>         -- 最多 2 行，溢出省略
  <阶段描述>         -- 1 行，运行中时显示
  <介入标记>         -- 需介入时显示红色文字
</内容层>
```

**默认态：**
- 填充：--surface-card（在蜜填充层之上的半透明白）
- 边框：2px 状态色
- 蜜填充：见 6.4 蜜填充效果
- 文字：任务名 --text-sm / --weight-semibold / --text-primary

**Hover 态：**
- transform: scale(1.06)
- 阴影：--shadow-md
- 显示 tooltip（ID + 描述 + 状态 + token 用量）

**拖拽态：**
- opacity: 0.8
- z-index: 100
- 取消 transition
- 依赖连线实时跟随

**需介入态：**
- 边框：3px --status-intervention
- 边框动画：脉冲闪烁（opacity 0.5 <-> 1.0），周期 1.5s
- 底部叠加红色渐变条（高 4px）

**已中断态：**
- 蜜填充冻结在当前液面
- 全格叠加 rgba(156, 163, 175, 0.2) 灰色遮罩
- 边框：2px --status-interrupted 虚线

### 6.4 蜜填充效果

核心视觉：六边形内部从底部向上以琥珀色"灌蜜"，液面高度 = 任务完成度。

**实现方式：**

```
外层 SVG 六边形提供 clip-path
内层结构：
├── 蜜填充 div
│   ├── background: linear-gradient(to top, var(--honey-600), var(--honey-400))
│   ├── height: {progress}%（从底部算起）
│   ├── position: absolute; bottom: 0; width: 100%
│   └── transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1)
└── 液面波纹（可选微动画）
    ├── 伪元素 ::after
    ├── 宽度 120%，左偏 -10%
    ├── 正弦波 SVG 路径 或 border-radius 模拟
    ├── animation: wave 3s ease-in-out infinite
    └── 高度 4px，opacity 0.3
```

**进度计算规则：**
- 待执行：0%（空蜂格，仅蜡色边框）
- 运行中：由 subAgent 完成比例决定（如 3/5 subAgent 完成 = 60%）
- 审查中：90%（接近满格但未封顶）
- 已完成：100%（满格金色 + 封蜡效果）
- 已暂停/已中断：冻结在暂停时的百分比

**封蜡效果（已完成）：**
- 蜜填充 100%
- 顶部叠加 4px 高的 --wax-dark 色条（蜡封）
- 整格 opacity 降为 0.7（即将移入归档）
- 1.5s 后自动滑入归档栏（如启用自动归档）

### 6.5 依赖连线

- 贝塞尔曲线，从源蜂格中心到目标蜂格中心
- 上游已完成：2px 实线 --status-completed
- 上游未完成：1px 虚线 --wax-dark，dasharray: 6 4
- 箭头：6px 三角形，填充同连线色
- Hover 蜂格时：关联连线高亮（线宽 +1px，opacity 1.0），其余连线 opacity 降至 0.15
- 默认全部隐藏，工具栏"依赖"开关控制

### 6.6 蜂巢网格背景

- 覆盖整个画布的六边形描边网格
- 描边：1px --wax-light
- 填充：透明
- 工具栏"网格"开关控制显隐
- 随画布缩放平移同步

---

## 7. 顶栏

- 高度：48px
- 背景：--surface-header + backdrop-filter: blur(12px)
- 底部边框：1px --border-light
- z-index: 200

**左侧：**
- Logo 图标（小六边形，16px，--honey-500 填充）+ "AgentHive" 文字，--text-base，--weight-bold，--text-primary
- 项目选择器（下拉），--text-sm

**右侧（从右到左）：**
- 用户头像（28px 圆形，首字母，--honey-500 背景）
- 通知图标 + 未读计数 badge（--status-intervention 背景，白色文字）
- 蜂巢占用指示：小六边形图标 + "X/Y" 文字 + 预算百分比
  - 百分比 > 50%：--text-secondary
  - 百分比 20%-50%：--honey-600
  - 百分比 < 20%：--status-intervention + 闪烁

---

## 8. 归档栏

- 固定画布底部，z-index: 50
- 折叠态：高度 40px，显示 "归档 (N)" + 展开箭头
- 展开态：高度 160px，水平滚动
- 背景：--surface-panel + backdrop-filter: blur(12px)
- 顶部边框：1px --border-light

**归档蜂格（缩略）：**
- 尺寸：--hex-size * 0.5 = 28px 外接圆
- 满格蜜填充 + 蜡封
- 仅显示任务名首字/缩写
- Hover 显示 tooltip（任务名 + 完成时间 + token 用量）
- 点击打开 L1 侧滑面板

---

## 9. 工具栏

- 固定画布右上角，距顶栏 12px，距右 12px
- 垂直排列，gap: 6px
- 每个按钮：36px 正方形，--radius-md
- 默认：--surface-card 背景，--border-light 边框
- Hover：--honey-100 背景
- Active/开启：--honey-200 背景，--honey-600 边框

**按钮列表（从上到下）：**

| 按钮 | 功能 | 类型 |
|------|------|------|
| 网格 | 显隐蜂巢背景网格 | 开关 |
| 依赖 | 显隐依赖连线 | 开关 |
| 整理 | 一键按环归位所有任务蜂格 | 动作 |
| 分析 | 触发依赖分析 | 动作 |
| 自动 | 自动执行开关 | 开关 |
| 规划 | 触发规划流程 | 动作 |
| + 想法 | 新建想法 | 动作 |
| + 任务 | 快速新建任务 | 动作 |

---

## 10. 缩放控件

- 固定画布右下角，距底 12px（归档栏折叠时）/ 距归档栏 12px
- 垂直排列，gap: 4px
- 按钮尺寸：32px
- 样式同工具栏按钮

**按钮：** +（放大）/ -（缩小）/ 百分比数字（点击重置 100%）/ 适应全部

---

## 11. 小地图

- 固定画布左下角，160px x 100px
- 背景：--surface-card
- 圆角：--radius-md
- 边框：1px --border-light
- 内容：画布全局缩略图 + 当前视口矩形框（--honey-500，2px 边框）
- 蜂格以色点表示（状态色填充，2px 圆点）

---

## 12. 状态图例

- 固定画布左上角，顶栏下方 12px
- 默认折叠为小图标（六边形 + 色谱条）
- 展开后显示 6 种状态的色点 + 名称
- 背景：--surface-card
- 圆角：--radius-md

---

## 13. L1 侧滑面板

- 宽度：480px
- 从右侧滑出，transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)
- 背景：--surface-panel + backdrop-filter: blur(16px)
- 左边框：1px --border-light
- z-index: 150

**顶栏：**
- 任务名（--text-base，--weight-bold，溢出省略）
- 状态 Badge（背景 = 状态色，文字 --text-inverse，--radius-sm，--text-xs）
- 关闭按钮（X，--text-secondary）
- 需介入时：顶部加 4px 高 --status-intervention 色条 + 介入原因文字

**三个 Tab：**

Tab 指示器用 --honey-500 下划线（2px），非活跃 Tab 文字 --text-muted。

**对话 Tab：**
- 三段式固定布局（顶栏/消息流可滚动/输入框固定底部）
- 消息气泡：
  - 用户消息：右对齐，--honey-100 背景，--radius-lg
  - Agent 消息：左对齐，--bg-subtle 背景，--radius-lg
  - subAgent 工作卡：可折叠，--bg-muted 背景，--radius-md，左侧 3px 状态色条
- 输入框：--radius-lg，1px --border-default 边框，focus 时 --honey-500 边框
- 发送按钮：--honey-500 背景，--text-inverse，--radius-md

**文件 Tab：**
- 文件列表，每行：文件路径 + 修改类型标记
  - 新增：--status-completed 色点
  - 修改：--honey-500 色点
  - 删除：--status-intervention 色点

**详情 Tab：**
- 信息卡片：--bg-subtle 背景，--radius-md
- 2 列网格（状态/类型/创建时间/Token 用量）
- subAgent 时间线：纵向，每个节点显示类型 + 状态 + token + 耗时
  - 完成：--status-completed 色圆点
  - 运行中：--status-running 色圆点 + 脉冲
  - 失败：--status-intervention 色圆点
- 操作按钮组：--radius-md，1px --border-default 边框，hover 时 --honey-100 背景
- 可折叠段落（需求文档/技术方案）：展开箭头 + 标题，内容区 --bg-muted 背景

---

## 14. L2 浮层

- 最大宽度：min(900px, 90vw)，最大高度：min(680px, 85vh)
- 居中显示
- 背景：--surface-card + backdrop-filter: blur(16px)
- 圆角：--radius-lg
- 阴影：--shadow-lg
- 遮罩层：--surface-overlay
- 关闭：右上角 X 按钮 + Esc 键 + 点击遮罩
- 进入动画：opacity 0->1 + scale(0.97)->scale(1)，0.2s ease
- z-index: 300

各 L2 浮层（对话/文件/提交记录/Skill/设置/用量）的内部布局详见需求文档对应章节，此处仅约束外框规格。

---

## 15. 登录页

- 全屏 --bg-base 背景
- 居中卡片：380px 宽，--surface-card 背景，--radius-lg，--shadow-lg，padding: 40px
- Logo：大六边形（--hex-size * 1.5），--honey-500 -> --honey-700 渐变填充
- 标题："AgentHive"，--text-2xl，--weight-bold，--text-primary
- 副标题："蜂巢协作空间"，--text-sm，--text-muted
- 输入框：--radius-md，1px --border-default 边框，focus 时 --honey-500 边框
- 按钮：--honey-500 背景，hover --honey-600，--text-inverse，--radius-md，--weight-medium
- 错误信息：--status-intervention 色

---

## 16. 初始化引导页

- 全屏 --bg-base 背景
- 居中卡片：480px 宽，同登录页样式
- 步骤指示器：水平排列 5 个六边形小图标，当前步骤 --honey-500 填充，已完成 --status-completed 填充，未到达 --wax 描边
- 每步内容区在卡片内切换
- "下一步"按钮同登录页主按钮样式

---

## 17. 动画系统

所有动画时长和缓动统一定义：

```css
:root {
  --duration-fast: 0.15s;
  --duration-normal: 0.3s;
  --duration-slow: 0.6s;

  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

| 场景 | 属性 | 时长 | 缓动 |
|------|------|------|------|
| 蜂格 hover 缩放 | transform | --duration-fast | --ease-default |
| 蜜填充液面变化 | height | --duration-slow | --ease-default |
| 面板滑出/收回 | transform | --duration-normal | --ease-default |
| L2 浮层出现 | opacity, transform | 0.2s | --ease-out |
| Logo 呼吸脉冲 | opacity | 3s | ease-in-out |
| 需介入边框闪烁 | border-opacity | 1.5s | ease-in-out |
| 液面波纹 | transform | 3s | ease-in-out |
| 封蜡滑入归档 | transform, opacity | --duration-slow | --ease-default |
| 拖拽中 | 无 transition | -- | -- |
| 归档栏展开/折叠 | height | --duration-normal | --ease-default |

---

## 18. CSS Modules 文件结构

```
client/src/
├── styles/
│   ├── variables.css          -- 所有 CSS 变量定义（本文档第 2-4、17 节的变量）
│   ├── global.css             -- 全局重置、body 基础样式、通用类
│   └── animations.css         -- @keyframes 定义
├── components/
│   ├── HexCanvas.module.css
│   ├── HexGrid.module.css
│   ├── HexCell.module.css
│   ├── TaskCell.module.css
│   ├── FunctionCell.module.css
│   ├── LogoCell.module.css
│   ├── DependencyLines.module.css
│   ├── SidePanel.module.css
│   ├── Toolbar.module.css
│   ├── ZoomControls.module.css
│   ├── StatusLegend.module.css
│   ├── ArchiveBar.module.css   -- 新增：归档栏
│   ├── MiniMap.module.css      -- 新增：小地图
│   └── TopBar.module.css       -- 新增：顶栏独立组件
├── routes/
│   ├── Canvas.module.css
│   ├── Login.module.css
│   └── Setup.module.css
```

**规则：**
- 组件内禁止 inline style（动态计算的 transform/position 除外）
- 颜色、间距、字号必须引用 CSS 变量
- 动态样式（如蜜填充高度、拖拽偏移）通过 CSS 变量 + style 属性注入：`style={{ '--fill-height': '60%' } as React.CSSProperties}`

---

## 19. 坐标系统迁移

当前 hex.ts 使用 offset 坐标系（col, row），需迁移到 axial 坐标系（q, r）。

**需修改的核心函数：**

```typescript
// 新坐标类型
export interface HexCoord {
  q: number;
  r: number;
}

// axial -> pixel（pointy-top）
export function hexToPixel(coord: HexCoord): Point {
  const x = HEX_SIZE * (Math.sqrt(3) * coord.q + Math.sqrt(3) / 2 * coord.r);
  const y = HEX_SIZE * (3 / 2 * coord.r);
  return { x, y };
}

// pixel -> axial
export function pixelToHex(point: Point): HexCoord {
  const q = (Math.sqrt(3) / 3 * point.x - 1 / 3 * point.y) / HEX_SIZE;
  const r = (2 / 3 * point.y) / HEX_SIZE;
  return hexRound(q, r);
}

// 环距离
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

// Ring N 上所有蜂格坐标（按角度顺序）
export function ringCoords(n: number): HexCoord[] {
  if (n === 0) return [{ q: 0, r: 0 }];
  const results: HexCoord[] = [];
  const directions: HexCoord[] = [
    { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 },
    { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 },
  ];
  let current: HexCoord = { q: n, r: 0 };
  for (let side = 0; side < 6; side++) {
    for (let step = 0; step < n; step++) {
      results.push({ ...current });
      current = {
        q: current.q + directions[(side + 2) % 6].q,
        r: current.r + directions[(side + 2) % 6].r,
      };
    }
  }
  return results;
}
```

**数据库兼容：** Task 表的 canvas_col / canvas_row 字段重命名为 canvas_q / canvas_r，数据库迁移脚本处理。

---

## 20. 需新增的组件

| 组件 | 文件 | 职责 |
|------|------|------|
| TopBar | TopBar.tsx | 顶栏独立组件（从 Canvas.tsx 抽离） |
| ArchiveBar | ArchiveBar.tsx | 底部归档栏，折叠/展开，水平滚动已完成任务 |
| MiniMap | MiniMap.tsx | 左下角小地图 |
| HoneyFill | HoneyFill.tsx | 蜜填充效果封装（SVG clip-path + 动态液面） |
| Tooltip | Tooltip.tsx | 通用 tooltip（hover 延迟显示） |
| NotificationCenter | NotificationCenter.tsx | 通知下拉面板 |

---

## 21. 交互约束

- 画布平移：鼠标左键空白区域拖拽 / 中键拖拽
- 画布缩放：滚轮，以鼠标位置为中心，范围 0.3x - 2.0x
- 蜂格拖拽：左键按住蜂格拖拽，松开时吸附到最近空位
- 蜂格点击：打开 L1 侧滑面板
- 功能蜂格点击：打开 L2 浮层
- 拖拽时禁止画布平移
- 同一时刻最多一个 L1 面板 + 一个 L2 浮层
- L2 浮层打开时画布仍可见但不可交互（遮罩层拦截）
