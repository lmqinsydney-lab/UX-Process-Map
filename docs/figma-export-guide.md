# Figma 高清截图导出指南

当前 Demo 使用从交付大图程序化裁切的截图（750px 宽）。若需更高清晰度，从 Figma 按下表导出 PNG（建议 2x，宽 750 及以上），按路径放入 `public/assets/pages/` 覆盖同名文件即可，代码零改动。

| 页面 | 状态 | 覆盖路径 |
| --- | --- | --- |
| 频道首页（入口） | 默认 | `public/assets/pages/channel-home/default.png` |
| 全部账单 | 默认 | `public/assets/pages/bill-all/default.png` |
| 本月账单 | 默认 | `public/assets/pages/bill-month/default.png` |
| 还款页 | 不展开期数 | `public/assets/pages/repay-page/collapsed.png` |
| 还款页 | 展开期数 | `public/assets/pages/repay-page/expanded.png` |
| 还款页 | 未配置优惠-期数展开 | `public/assets/pages/repay-page/nocoupon-expanded.png` |
| 还款页 | 未配置优惠-期数收起 | `public/assets/pages/repay-page/nocoupon-collapsed.png` |
| 分期计划（半层） | 默认 | `public/assets/pages/plan-sheet/default.png` |
| 线上页面 | 线上现状 | `public/assets/pages/online-page/default.png` |
| 频道首页（分期还款） | 默认 | `public/assets/pages/ir-channel-home/default.png` |
| 分期还款页 | 改动后 | `public/assets/pages/ir-repay-page/default.png` |
| 分期成功（已还清） | 默认 | `public/assets/pages/success-paid/default.png` |
| 分期成功（未还清） | 默认 | `public/assets/pages/success-unpaid/default.png` |
| 分期记录页 | 默认 | `public/assets/pages/record-list/default.png` |
| 分期详情页 | 默认 | `public/assets/pages/record-detail/default.png` |

注意：

1. 导出图需为整页截图（含状态栏可选），宽高比与 375:812 接近即可；热区按百分比定位，等比缩放不受影响。
2. 若页面内容与当前裁切图差异较大（模块位置变动），需同步调整 `src/data/project.json` 中对应 `hotzones` 百分比坐标。
3. 新增「页面 × 状态」时：在 `project.json` 增加 state（`image` 指向新路径）并放入图片，`npm run validate` 校验通过即可。
