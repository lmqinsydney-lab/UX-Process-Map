# 会话交接文档（HANDOFF）

> 供新对话快速接上下文。项目目录 `/Users/didi/UX-Process-Map`，本文件即最新事实源；长期偏好已在 memory（MEMORY.md 会自动加载）。

## 1. 项目是什么

**可视化体验链路**：交互设计师（用户，滴滴金融/月付方向）的工具链 Demo——
`一句话/PRD → 流程图（可编辑）→ 自动生图 → 可视化体验链路（画布浏览页面/模块/状态/流转）`。
终态愿景：五阶段管线（需求卡→PRD→UX拆解→生图→链路协作场）+ 知识库飞轮 + 与前端 DSC（双源协同）对接，详见 `docs/从一句话到可视化体验链路-项目方案.md`。

## 2. 仓库与部署

- GitHub（公开）: https://github.com/lmqinsydney-lab/UX-Process-Map （main 分支，凭证在 osxkeychain）
- 线上: https://lmqinsydney-lab.github.io/UX-Process-Map/ （`npm run deploy` 推 gh-pages；若报 gh-pages exists 先 `rm -rf dist/.git`）
- 本地: `npm run dev` → http://localhost:5173/UX-Process-Map/ （vite base 是 /UX-Process-Map/）；预览用 preview_start name=ux-journey-canvas
- 常用: `npx tsc --noEmit`、`npm run build`、`node scripts/validate-data.mjs`（数据校验+模块同一性警告门禁）
- 惯例：每轮改动 → tsc → 浏览器验证 → commit（中文、Co-Authored-By Claude Fable 5）→ push → deploy

## 3. 当前产品形态（前置生成页 + 两步 tab，单 React 应用）

**前置页 · 一句话/PRD 生成**（`src/components/flowgen/GenStep.tsx`，居中 hero 布局，无 step-tabs）：
- 一句话输入 + 模板 chips / PRD 内联 textarea（mock：关键词模板 车险/电商/登录/外卖 + PRD 正则，`src/flowgen/templates.ts`，移植自同事 FlowCraft demo，原件归档 `docs/reference/flowcraft-demo.html`）
- 生成完成 `onGenerated(flow)` → App 装入 genFlow/flowVersion → 跳转流程编辑页

**第一步 · 流程编辑**（`src/components/flowgen/FlowStep.tsx`，常驻挂载保留现场；工具栏「← 重新输入」可回前置页，无流程时空态含「去生成流程」按钮）：
- 节点可编辑：hover/选中态、拖拽、增删节点（页面/判断）、拖桩连线、右侧详情面板（名称/简介/删除）、**节点多状态增删改**（面板状态列表，节点显示"n 个状态"角标）
- 节点聚焦与链路页页面聚焦保持一致：选中节点或新增页面/判断节点时，画布为右侧面板留位并将节点居中放大；手动移开视口后新增页面状态，会自动拉回当前节点。定位等待节点测量完成后只执行一次，避免重复动画/全图 refit 造成抖动
- 底部居中强 CTA「生成可视化链路」（唯一出口，无逐节点手动生图）
- **链路失效门控**：未生成链路或流程被语义性修改（重新生成/增删节点/连线/编辑内容，拖拽位置与选中除外）时 `hasLink=false`，「② 可视化链路」tab 禁用；跑完管线或加载示例项目解锁

**管线**（`src/flowgen/compile.ts`）：逐节点×逐状态 mock 生图（`src/flowgen/pagegen.ts`，迷你设计系统 buildSpec/renderPageBody，// @ts-nocheck 移植代码）→ 离屏渲染测量 `.comp` 组件包围盒 = **模块热区**（组件清单即模块划分，COMP_MODULE 映射 18 种组件→全局模块）→ 截图（toPng 3.5s 超时自适应降级 foreignObject SVG 快照，`pngUnavailable` 会话级标记）→ 编译 project.json → setProject → 进入第二步。判断节点→decisions；主按钮挂 clickEdgeId=首条主流程出边。

**第二步 · 可视化链路**（原有画布，数据源动态化）：
- `src/data/loader.ts`：`export let project`（ESM live binding）+ setProject(localStorage 'uxpm.project' 持久化)+ demoProject（月付分期还款示例，顶栏「示例项目」按钮加载）；App 用 projVersion key 重建画布
- 判断节点：菱形小卡（decisionNode），点击弹分支规则气泡；不可聚焦；schema `decisions[] + seq` 与页面混排

## 4. 数据模型（src/types/model.ts + src/data/project.json）

processNodes（流程分组）→ pages（states[]: id/name/image(路径或dataURL)/note/moduleStates；moduleInstances[]: moduleId/hotzones{stateId→%rect}/visibleWhen/clickEdgeId/instanceNote；seq）+ decisions[] + modules（全局定义含状态枚举）+ edges（from/to{pageId,stateId?}/event/condition/type main|branch|error|back）。

**建模规约（已进 memory，必须遵守）**：
1. 流转触发必须落在可交互组件（按钮/列表项/tab），气泡/角标只是装饰引导；图上没标注的流转不得编造，推断打 TODO(待确认)
2. 骨架相同仅条件差异的多张页面图 → 自主合并为一页多状态（visibleWhen + to.stateId），无需询问
3. 模块同一性按组件结构/形态/状态机判定，禁止语义相近归并；归并前必须截图并排比对；症状=实例到不了模块大部分状态（validate 脚本有警告门禁）；容器型操作组允许场景性单/双按钮变化（用户裁定）

## 5. 链路端已实现交互（全部验证过）

全览：流程分组容器、页面卡完整截图、"n 个状态"角标（单状态隐藏）→ 原位展开状态托盘（状态卡可点击→聚焦该状态）；连线泳道化（区间图着色按跨度嵌套、跨线桥、标签压线+画布色 outline 光环）；跨流程边聚合为分组级单箭头（×n 计数，点击气泡列全部明细；gback 反向沿下方回勾）；组内无流转邻页窄间距 36px。
聚焦（画布内推近，非独立页）：右侧停靠面板（页面名+编辑占位、模块手风琴卡片：收起即显状态切换器、本页无形态的状态直接不展示、visibleWhen 置灰+条件行、出现在哪些页面跳转）；左侧热区——进入页面闪烁提示（淡入0.6s/保持0.2s/淡出0.6s、10%紫）、hover 高亮常显不描边、面板卡 hover 联动页面高亮、选中=聚光灯（单元素+巨幅投影，6px 圆角与 hover 一致，无描边）、选中时禁用一切 hover/闪烁；模块状态切换联动页面状态（moduleStates 最近匹配）、切状态/选模块自动拉回视口；双击带 clickEdgeId 热区跳转目标页；线上参考对比（onlineCompare 并排）；Esc/←→、点空白关闭气泡与托盘。

## 6. 环境坑（重要）

内嵌预览面板（Claude Browser pane）**ResizeObserver / rAF / CSS transition·animation / document.fonts 全部可能失效**，且隐藏时定时器强限流：
- 所有 React Flow 画布必须挂 `src/components/MeasureFallback.tsx`（手动喂节点尺寸；fitView 只首次且非聚焦态）——否则边全部消失、且曾因依赖 graph 重跑导致"点模块回全览"的 bug
- 动画类验证在面板里不可见（zoomToPage/transition 冻结），需用 DOM/computed style 断言或让用户真机看
- 生图截图在此环境走 SVG 快照降级（真浏览器走 toPng PNG）

## 7. 文档索引（docs/）

- `从一句话到可视化体验链路-项目方案.md`：五阶段方案 V0.2（含 §3.4 知识沉淀飞轮、指标、里程碑）
- `module-identity-audit.md` + `module-audit/*.png`：模块同一性审计（已按设计裁定落库）
- `superpowers/specs|plans/`：最初 Demo 的设计文档与实现计划
- `reference/flowcraft-demo.html`：同事原 demo 归档
- Cooper 知识库读写：本机 `mcporter call Cooper.<tool>`（readContent/updateKnowledgeDocument 等 31 个工具可用）；DSC 双源协同参考文档已读过（设计 UI 源+前端技术源+Agent 融合，三阶段），对接思路=链路当"行为契约层"，module-id 三方锚点

## 8. 未决/候选下一步

- 管线增量重生成（现在重跑覆盖链路 1.0）与版本 diff
- 拆解引擎真身：ux-prd-analyzer skill 输出 schema 化（阶段③）；生成侧接真 AI（现全 mock）
- 编辑能力（对话编辑仍是 UI 占位）、评论/协作、与 DSC 对接章节落入方案文档
- 方案文档更新到 Cooper 页 2209151648859（Chrome 扩展未连，可用 mcporter updateKnowledgeDocument 试）
