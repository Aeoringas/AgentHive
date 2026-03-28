# 蜂格拖拽功能规格

## 目标

FunctionCell 和 TaskCell 支持鼠标拖拽，拖到新位置后吸附到最近的六边形网格坐标。

## 涉及文件

| 文件 | 职责 |
|------|------|
| `client/src/hooks/useDrag.ts` | 需要新建。拖拽核心 hook |
| `client/src/components/FunctionCell.tsx` | 功能蜂格，需要接入拖拽 |
| `client/src/components/TaskCell.tsx` | 任务蜂格，需要接入拖拽 |
| `client/src/components/SnapPreview.tsx` | 需要新建。拖拽时显示目标格子预览 |
| `client/src/components/SnapPreview.module.css` | 需要新建。预览样式 |
| `client/src/routes/Canvas.tsx` | 画布，管理拖拽状态和回调 |

## 不涉及的文件（不要修改）

| 文件 | 说明 |
|------|------|
| `client/src/components/HexCell.tsx` | 基础定位组件，用 left/top 定位，style prop 透传。已经可用，不需要改 |
| `client/src/components/HexCell.module.css` | 用 left/top + margin 居中定位。不要改成 transform 定位 |
| `client/src/components/HexCanvas.tsx` | 画布平移/缩放容器。提供 CanvasContext（panX, panY, zoom）。不要修改 |
| `client/src/utils/hex.ts` | 坐标工具函数。hexToPixel、pixelToHex、hexPath 等已可用 |

## 架构约束

### 定位机制

HexCell 用 CSS `left/top` 做基础定位（见 HexCell.module.css），`transform` 属性留给子组件使用（hover scale、drag translate）。**绝对不能用 transform 做基础定位**，否则会和子组件的 transform 冲突。

### 坐标系

- 六边形用 axial 坐标系 `{ q: number, r: number }`（HexCoord 类型）
- `hexToPixel(coord)` 把 axial 坐标转为像素坐标
- `pixelToHex(point)` 把像素坐标转为最近的 axial 坐标（含 rounding）
- 画布有缩放（zoom），拖拽偏移量需要除以 zoom 才是世界坐标系的偏移

### React 18 批量更新陷阱

mouseUp 时 `onDragEnd(snapCoord)` 会触发父组件更新 coord prop。React 18 会把 hook 内的 setState 和父组件的 setState 合并到同一帧渲染。如果此时 dragOffset 还在，left/top 已经到新位置 + transform 的 translate 偏移 = 视觉上双重偏移，导致弹跳。

**解决方案**：在渲染期间（不是 useEffect 中）检测 coord 变化并清除 dragOffset。React 允许在渲染中调用 setState，会中止当前渲染用新状态重新渲染，确保 `dragOffset=null` 和 `coord=newCoord` 在同一帧生效。

```typescript
// 渲染期间检测（不是 useEffect）
const prevCoord = useRef(options.currentCoord);
if (prevCoord.current.q !== options.currentCoord.q || prevCoord.current.r !== options.currentCoord.r) {
  prevCoord.current = options.currentCoord;
  if (dragOffset !== null) {
    setDragOffset(null); // React 中止当前渲染，用 null 重新渲染
  }
}
```

## 功能需求

### 1. useDrag hook

输入：
- `currentCoord: HexCoord` -- 蜂格当前的 axial 坐标
- `onDragEnd: (coord: HexCoord) => void` -- 松手后回调，传入吸附目标坐标

输出：
- `isDragging: boolean` -- 是否正在拖拽中
- `dragOffset: Point | null` -- 当前拖拽偏移量（世界坐标系，已除以 zoom）
- `snapPreview: HexCoord | null` -- 拖拽中实时计算的吸附目标坐标
- `handleMouseDown: (e: React.MouseEvent) => void` -- 绑定到可拖拽元素

逻辑：
- 左键按下记录起点，移动超过 5px 阈值后进入拖拽状态
- 拖拽中 dragOffset 实时更新（clientDelta / zoom）
- 拖拽中 snapPreview 实时更新：`pixelToHex(hexToPixel(currentCoord) + dragOffset)`
- 松手时调用 onDragEnd(snapCoord)，同时清除拖拽状态
- 需要用 CanvasContext 获取当前 zoom 值
- mouseDown 需要 stopPropagation 防止触发画布平移
- mousemove/mouseup 监听 window（拖出元素也要响应）

### 2. SnapPreview 组件

拖拽过程中在目标网格位置显示的预览格子：
- 与 HexCell 同样的 left/top 定位方式
- 淡黄色填充 + 琥珀色虚线边框
- `pointer-events: none`
- z-index 低于拖拽中的蜂格

### 3. FunctionCell 接入拖拽

Props 新增：
- `onDragEnd?: (label: string, coord: HexCoord) => void`
- `onSnapPreview?: (preview: HexCoord | null) => void`

视觉效果：
- 拖拽中：蜂格跟随鼠标（用 transform translate），opacity 0.8，z-index 100
- hover（非拖拽时）：scale(1.06) 带 transition
- 非拖拽非 hover：无额外 transform
- 拖拽中的 transform 不要加 transition（会有延迟感）

### 4. TaskCell 接入拖拽

与 FunctionCell 相同的拖拽逻辑，Props 新增：
- `onDragEnd?: (taskId: string, coord: HexCoord) => void`
- `onSnapPreview?: (preview: HexCoord | null) => void`

### 5. Canvas 集成

- 维护 `snapPreview: HexCoord | null` 状态
- 维护 `funcPositions: Record<string, HexCoord>` 状态（功能蜂格拖拽后的新位置）
- `handleTaskDragEnd`: 更新 task 的 canvas_q/canvas_r
- `handleFuncDragEnd`: 更新 funcPositions
- 将 snapPreview 传入 CanvasInner 渲染 SnapPreview 组件

## 验收标准

1. 拖拽蜂格时，蜂格跟随鼠标平滑移动，无延迟
2. 拖拽中目标格子显示淡黄色虚线预览
3. 松手后蜂格立即出现在目标格子位置，无弹跳/闪烁/中间帧错位
4. 缩放状态下拖拽正常（偏移量正确除以 zoom）
5. 短距离点击（未超过 5px 阈值）不触发拖拽，正常触发 onClick
6. 拖拽中鼠标移出蜂格范围仍然响应
