// @ts-nocheck
/* eslint-disable */
/* 从同事 FlowCraft demo（docs/reference/flowcraft-demo.html）移植的页面生成能力：
   迷你设计系统渲染器 + 按节点语义拼装组件的 buildSpec（mock 生图）。C/B 端完整保留。 */
const MI = {
  flow:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M6.6 6.6l3.6 3.6M17.4 6.6l-3.6 3.6M6.6 17.4l3.6-3.6M17.4 17.4l-3.6-3.6"/>',
  spark:'<path fill="currentColor" stroke="none" d="M12 2l2 5.5L19.5 9.5 14 11.5 12 17l-2-5.5L4.5 9.5 10 7.5 12 2zM18.8 14.5l1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1 1.1-2.9z"/>',
  doc:'<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9.5 12h5M9.5 16h5"/>',
  save:'<path d="M5 3h12l4 4v14H5z"/><path d="M8 3v5h8V3M8 21v-7h8v7"/>',
  library:'<path d="M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5zM4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
  map:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
  car:'<path d="M5 11l1.7-4.7A2 2 0 0 1 8.6 5h6.8a2 2 0 0 1 1.9 1.3L19 11M3 17v-5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5h-2.5M7.5 17h9"/><circle cx="6" cy="17.5" r="1.6"/><circle cx="18" cy="17.5" r="1.6"/>',
  cart:'<path d="M3 4h2.5l2 12H19l2-9H7"/><circle cx="9.5" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  food:'<path d="M4 12h16a8 8 0 0 1-16 0zM8.5 12V5.5M12 12V4.5M15.5 12V5.5M8 21h8"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  send:'<path fill="currentColor" stroke="none" d="M3 20v-6l13-2L3 10V4l19 8-19 8z"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
  campaign:'<path d="M3 10v4h3l8 4V6l-8 4H3z"/><path d="M18 9a5 5 0 0 1 0 6"/>',
  robot:'<rect x="4.5" y="8" width="15" height="11" rx="3"/><path d="M12 8V5"/><circle cx="12" cy="3.8" r="1.2"/><circle cx="9.3" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="14.7" cy="13" r="1" fill="currentColor" stroke="none"/><path d="M9.5 16.2h5"/>',
  person:'<circle cx="12" cy="8" r="3.6"/><path d="M5 20.5a7.2 7.2 0 0 1 14 0"/>',
  schedule:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.4 2"/>',
  del:'<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13.5h9l1-13.5M10 11v6M14 11v6"/>',
  tree:'<rect x="3" y="3" width="7" height="5" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="16" width="7" height="5" rx="1"/><path d="M6.5 8v8.5a2 2 0 0 0 2 2H14"/>',
  smartphone:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
  check:'<path d="M4.5 12.5l5 5L20 6.5"/>',
  gift:'<rect x="4" y="8" width="16" height="4" rx="1"/><path d="M6 12v8h12v-8M12 8v12M12 8s-1.5-4.5-4-3.5S9 8 12 8zM12 8s1.5-4.5 4-3.5S15 8 12 8z"/>',
  chat:'<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9.5L4 20V6z"/>',
  tune:'<path d="M4 8h8.5M17.5 8H20M4 16h2M10.8 16H20"/><circle cx="15" cy="8" r="2.2"/><circle cx="8.5" cy="16" r="2.2"/>',
  shield:'<path d="M12 3l7.5 3v5.5c0 4.6-3.2 7.8-7.5 9.5-4.3-1.7-7.5-4.9-7.5-9.5V6l7.5-3z"/>',
  health:'<rect x="4" y="4" width="16" height="16" rx="5"/><path d="M12 8.5v7M8.5 12h7"/>',
  flight:'<path d="M10.5 20.5v-3l-6.5-2v-2l6.5 1V8c0-2.2 1.5-4.5 1.5-4.5S13.5 5.8 13.5 8v6.5l6.5-1v2l-6.5 2v3l-1.5-.8-1.5.8z"/>',
  home:'<path d="M4 11l8-7 8 7v9.5h-5.5V14h-5v6.5H4V11z"/>',
  receipt:'<path d="M6.5 3h11v18l-1.8-1.4-1.9 1.4-1.8-1.4L10.2 21l-1.9-1.4L6.5 21V3z"/><path d="M9.5 8h5M9.5 12h5"/>',
  card:'<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M6.5 14.5h4"/>',
  wallet:'<path d="M20.5 12V9.5a2 2 0 0 0-2-2H5a1.5 1.5 0 0 1 0-3h11.5"/><path d="M3.5 6V17a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-2"/><path d="M16 12h4.5v3H16a1.5 1.5 0 0 1 0-3z"/>',
  star:'<path fill="currentColor" stroke="none" d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9L12 2.5z"/>',
  pin:'<path d="M9 3.5h6V9l2.5 3h-11L9 9V3.5zM12 12v8"/>',
  store:'<path d="M4.5 9.5L6 4h12l1.5 5.5M4.5 9.5V20h15V9.5M4.5 9.5h15M10 20v-5.5h4V20"/>',
  wrench:'<path d="M14.5 6.5a4.2 4.2 0 0 0-5.6 5.6L4 17v3h3l4.9-4.9a4.2 4.2 0 0 0 5.6-5.6l-2.5 2.5-2.6-2.6 2.7-2.5z"/>',
  call:'<path d="M6.5 3.5h3L11 8l-2 1.5a13 13 0 0 0 5.5 5.5L16 13l4.5 1.5v3a2 2 0 0 1-2 2C10 19.5 4.5 14 4.5 5.5a2 2 0 0 1 2-2z"/>',
  headset:'<path d="M4.5 13.5a7.5 7.5 0 0 1 15 0"/><rect x="3.5" y="13.5" width="4" height="6" rx="1.5"/><rect x="16.5" y="13.5" width="4" height="6" rx="1.5"/>',
  inbox:'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 13.5H9a3 3 0 0 0 6 0h5.5"/>',
  palette:'<path d="M12 3a9 9 0 0 0 0 18c1.6 0 2.2-1.1 1.6-2.2-.6-1.2.2-2.3 1.6-2.3H17a4.5 4.5 0 0 0 4.5-4.5C21.5 7 17 3 12 3z"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none"/><circle cx="16.5" cy="10.5" r="1" fill="currentColor" stroke="none"/>',
  dropdown:'<path d="M7 10l5 5 5-5"/>',
  chevleft:'<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  box:'<path d="M3.5 7.5L12 3.5l8.5 4v9l-8.5 4-8.5-4v-9zM3.5 7.5l8.5 4 8.5-4M12 11.5v9"/>',
  signal:'<path d="M4.5 18v-3M9.5 18v-6M14.5 18v-9M19.5 18V5"/>',
  battery:'<rect x="2.5" y="8" width="16" height="8" rx="2"/><path d="M21.5 11v2"/>',
  coupon:'<path d="M3.5 9V6.5a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1V9a2.5 2.5 0 0 0 0 6v2.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V15a2.5 2.5 0 0 0 0-6z"/><path d="M14.5 6.5v11" stroke-dasharray="2.5 2.5"/>',
  fit:'<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>',
  minus:'<path d="M5.5 12h13"/>',
  plus:'<path d="M12 5.5v13M5.5 12h13"/>',
  expand:'<path d="M13.5 4H20v6.5M10.5 20H4v-6.5M20 4l-7.5 7.5M4 20l7.5-7.5"/>',
};
function mi(name, size, cls){
  size = size || 20;
  return `<svg class="mi${cls ? ' ' + cls : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${MI[name] || ''}</svg>`;
}
function payIcon(k){
  const map = { wechat:{ bg:'#07C160', ic:'chat' }, alipay:{ bg:'#1677FF', ic:'wallet' }, card:{ bg:'#8A93A6', ic:'card' } };
  const m = map[k] || map.card;
  return `<span style="width:26px;height:26px;border-radius:50%;background:${m.bg};color:#fff;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${mi(m.ic, 14)}</span>`;
}
const FRAMEWORKS = [ {k:'react',name:'React'}, {k:'vue',name:'Vue 3'}, {k:'flutter',name:'Flutter'}, {k:'mp',name:'小程序'} ];
const SIDES = [ {k:'c',name:'C 端'}, {k:'b',name:'B 端'} ];
const DESIGN_SYSTEMS = [
  { k:'ddbao-b', name:'滴滴保B端',   p:'#2E6BE6', side:'b' },
  { k:'ddpay-b', name:'滴滴支付B端', p:'#0AA1A7', side:'b' },
  { k:'gone-c',  name:'G-One C',     p:'#FF6400', side:'c' },
  { k:'none',    name:'不使用设计系统', p:'#8A93A6', wire:true },
];
const DS_MAP = Object.fromEntries(DESIGN_SYSTEMS.map(d => [d.k, d]));
const PAGETYPES = [
  {k:'auto',name:'不指定页面类型'}, {k:'home',name:'首页'}, {k:'list',name:'列表页'},
  {k:'form',name:'表单页'}, {k:'detail',name:'详情页'}, {k:'pay',name:'收银台'}, {k:'result',name:'结果页'},
];
const PT_KEYWORDS = { home:'首页', list:'列表', form:'信息 填写', detail:'详情', pay:'支付 收银', result:'成功 结果' };

const THEMES = {
  blue:   { p:'#3D5AFE', name:'蓝色' },
  orange: { p:'#F97316', name:'橙色' },
  green:  { p:'#0DA678', name:'绿色' },
  red:    { p:'#E5484D', name:'红色' },
  purple: { p:'#8B5CF6', name:'紫色' },
};

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* 组件渲染器：一个极简"设计系统" */
const DS = {
  navbar: c => `<div class="comp" style="background:var(--card);padding:12px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #EEF1F6;flex-shrink:0">
    <span style="color:#333;line-height:0">${mi('chevleft', 16)}</span><b style="font-size:15px;flex:1;text-align:center;margin-right:16px">${esc(c.title)}</b></div>`,

  search: c => `<div class="comp" style="padding:10px 14px;background:var(--card)">
    <div style="background:#F2F4F8;border-radius:20px;padding:8px 14px;font-size:12px;color:#98A1B3;display:flex;align-items:center;gap:6px">${mi('search', 14)}${esc(c.placeholder || '搜索')}</div></div>`,

  banner: c => `<div class="comp" style="margin:12px 14px;border-radius:14px;padding:18px 16px;color:#fff;background:linear-gradient(120deg,var(--p),color-mix(in srgb,var(--p) 55%,#7048F6))">
    <div style="font-size:16px;font-weight:800">${esc(c.title)}</div>
    <div style="font-size:11.5px;opacity:.85;margin-top:5px">${esc(c.subtitle || '')}</div>
    ${c.btn ? `<div style="display:inline-block;margin-top:10px;background:#fff;color:var(--p);font-size:11px;font-weight:700;padding:5px 13px;border-radius:16px">${esc(c.btn)}</div>` : ''}</div>`,

  notice: c => `<div class="comp" style="margin:0 14px 4px;background:color-mix(in srgb,var(--p) 8%,#fff);border-radius:9px;padding:8px 12px;font-size:11px;color:var(--p);display:flex;gap:6px;align-items:center">${mi('campaign', 14)}<span style="flex:1">${esc(c.text)}</span></div>`,

  grid: c => `<div class="comp" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;background:var(--card);margin:12px 14px;border-radius:16px;padding:16px 8px">
    ${(c.items || []).map(i => `<div style="text-align:center"><div style="width:40px;height:40px;margin:0 auto;border-radius:12px;background:color-mix(in srgb,var(--p) 10%,#fff);display:flex;align-items:center;justify-content:center;color:var(--p)">${mi(i.icon, 20)}</div><div style="font-size:10.5px;color:#5A6478;margin-top:6px">${esc(i.label)}</div></div>`).join('')}</div>`,

  steps: c => { const items = c.items || []; const act = c.active == null ? 1 : c.active;
    return `<div class="comp" style="display:flex;background:var(--card);margin:12px 14px;border-radius:12px;padding:13px 10px">
    ${items.map((s, i) => `<div style="flex:1;text-align:center;position:relative">
      ${i > 0 ? `<div style="position:absolute;left:-50%;top:9px;width:100%;height:2px;background:${i <= act ? 'var(--p)' : '#E5E9F2'}"></div>` : ''}
      <div style="position:relative;width:20px;height:20px;border-radius:50%;margin:0 auto;font-size:10.5px;line-height:20px;color:${i <= act ? '#fff' : '#98A1B3'};background:${i <= act ? 'var(--p)' : '#E5E9F2'};font-weight:700">${i + 1}</div>
      <div style="font-size:10px;margin-top:5px;color:${i <= act ? 'var(--p)' : '#98A1B3'};font-weight:${i === act ? 700 : 400}">${esc(s)}</div></div>`).join('')}</div>`; },

  cards: c => `<div class="comp" style="margin:0 14px">${(c.items || []).map(i => `
    <div style="background:var(--card);border-radius:13px;padding:13px;margin-bottom:10px;display:flex;gap:11px">
      <div style="width:52px;height:52px;border-radius:12px;background:color-mix(in srgb,var(--p) 12%,#fff);display:flex;align-items:center;justify-content:center;color:var(--p);flex-shrink:0">${mi(i.icon || 'box', 24)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px">${esc(i.title)}${i.tag ? `<span style="font-size:9px;color:var(--p);border:1px solid var(--p);border-radius:4px;padding:1px 4px;font-weight:600">${esc(i.tag)}</span>` : ''}</div>
        <div style="font-size:10.5px;color:#98A1B3;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(i.desc || '')}</div>
        ${i.price ? `<div style="margin-top:5px;font-size:14px;color:#E5484D;font-weight:800">¥${esc(i.price)}<span style="font-size:10px;color:#98A1B3;font-weight:400"> 起</span></div>` : ''}
      </div></div>`).join('')}</div>`,

  plans: c => `<div class="comp" style="margin:0 14px;display:flex;gap:9px">${(c.items || []).map((i, idx) => `
    <div style="flex:1;background:var(--card);border-radius:13px;padding:13px 9px;text-align:center;border:2px solid ${idx === 1 ? 'var(--p)' : 'transparent'};position:relative">
      ${idx === 1 ? `<div style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:var(--p);color:#fff;font-size:9px;padding:2px 9px;border-radius:8px;white-space:nowrap">推荐</div>` : ''}
      <div style="font-size:12px;font-weight:700">${esc(i.title)}</div>
      <div style="font-size:15px;color:#E5484D;font-weight:800;margin:7px 0 3px">¥${esc(i.price)}</div>
      <div style="font-size:9.5px;color:#98A1B3">${esc(i.desc)}</div></div>`).join('')}</div>`,

  form: c => `<div class="comp" style="background:var(--card);margin:12px 14px;border-radius:13px;padding:4px 14px">
    ${(c.fields || []).map(f => `<div style="display:flex;align-items:center;padding:12px 0;border-bottom:1px solid #F2F4F8;">
      <div style="width:78px;font-size:12.5px;font-weight:600;flex-shrink:0">${esc(f.label)}</div>
      <div style="flex:1;font-size:12.5px;color:${f.value ? '#1B2430' : '#B6BECF'}">${esc(f.value || f.placeholder || '请输入')}</div>
      <div style="color:#C9CFDD;font-size:12px">${f.arrow ? '›' : ''}</div></div>`).join('')}</div>`,

  info: c => `<div class="comp" style="background:var(--card);margin:12px 14px;border-radius:13px;padding:6px 14px">
    ${c.title ? `<div style="font-size:13px;font-weight:700;padding:10px 0 4px">${esc(c.title)}</div>` : ''}
    ${(c.rows || []).map(r => `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:12px">
      <span style="color:#98A1B3">${esc(r.k)}</span><span style="font-weight:600">${esc(r.v)}</span></div>`).join('')}</div>`,

  amount: c => `<div class="comp" style="text-align:center;padding:26px 0 18px">
    <div style="font-size:12px;color:#98A1B3">${esc(c.label || '需支付金额')}</div>
    <div style="font-size:34px;font-weight:800;margin-top:6px">¥<span>${esc(c.value)}</span></div>
    ${c.tip ? `<div style="display:inline-block;margin-top:8px;font-size:10.5px;color:#E5484D;background:#FEF0F0;padding:3px 10px;border-radius:12px">${esc(c.tip)}</div>` : ''}</div>`,

  paylist: c => `<div class="comp" style="background:var(--card);margin:0 14px;border-radius:13px;padding:4px 14px">
    ${(c.methods || [{icon:'wechat',name:'微信支付',sel:1},{icon:'alipay',name:'支付宝'},{icon:'card',name:'银行卡支付'}]).map(m => `
    <div style="display:flex;align-items:center;gap:10px;padding:13px 0;border-bottom:1px solid #F2F4F8">
      ${payIcon(m.icon)}<span style="flex:1;font-size:13px;font-weight:600">${esc(m.name)}</span>
      <span style="width:17px;height:17px;border-radius:50%;border:2px solid ${m.sel ? 'var(--p)' : '#D7DDEA'};display:inline-flex;align-items:center;justify-content:center">${m.sel ? `<i style="width:9px;height:9px;border-radius:50%;background:var(--p)"></i>` : ''}</span></div>`).join('')}</div>`,

  agreement: c => `<div class="comp" style="margin:12px 18px;font-size:10.5px;color:#98A1B3;display:flex;gap:6px;align-items:flex-start">
    <span style="width:14px;height:14px;border-radius:50%;background:var(--p);color:#fff;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${mi('check', 9)}</span>
    <span>已阅读并同意 <span style="color:var(--p)">${esc(c.text || '《服务协议》《隐私政策》')}</span></span></div>`,

  button: c => `<div class="comp" style="padding:14px;margin-top:auto;flex-shrink:0;background:var(--card);border-top:1px solid #F0F2F7">
    <div style="background:linear-gradient(120deg,var(--p),color-mix(in srgb,var(--p) 62%,#333));color:#fff;text-align:center;padding:13px;border-radius:24px;font-size:14.5px;font-weight:700">${esc(c.text)}</div>
    ${c.sub ? `<div style="text-align:center;font-size:10px;color:#98A1B3;margin-top:8px">${esc(c.sub)}</div>` : ''}</div>`,

  result: c => `<div class="comp" style="text-align:center;padding:38px 20px 22px">
    <div style="width:64px;height:64px;border-radius:50%;background:${c.status === 'fail' ? '#F9DEDC' : 'color-mix(in srgb,var(--p) 12%,#fff)'};color:${c.status === 'fail' ? '#B3261E' : 'var(--p)'};display:flex;align-items:center;justify-content:center;margin:0 auto">${c.status === 'fail' ? mi('close', 28) : mi('check', 28)}</div>
    <div style="font-size:17px;font-weight:800;margin-top:14px">${esc(c.title)}</div>
    <div style="font-size:11.5px;color:#98A1B3;margin-top:7px;line-height:1.6">${esc(c.desc || '')}</div></div>`,

  coupon: c => `<div class="comp" style="margin:12px 14px;display:flex;background:linear-gradient(100deg,#FFF3E8,#FFE8E0);border-radius:12px;padding:12px 14px;align-items:center;gap:10px">
    <div style="color:#C2410C;line-height:0">${mi('coupon', 24)}</div><div style="flex:1"><div style="font-size:12.5px;font-weight:700;color:#C2410C">${esc(c.title || '新客立减 50 元')}</div>
    <div style="font-size:10px;color:#C2410C;opacity:.7;margin-top:2px">${esc(c.desc || '有效期 7 天 · 全场可用')}</div></div>
    <div style="background:#F97316;color:#fff;font-size:10.5px;padding:5px 12px;border-radius:14px;font-weight:600">领取</div></div>`,

  progress: c => `<div class="comp" style="background:var(--card);margin:12px 14px;border-radius:13px;padding:18px 16px">
    <div style="display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:50%;border:3px solid var(--p);border-top-color:#E5E9F2;animation:spin 1.2s linear infinite"></div>
    <div><div style="font-size:13.5px;font-weight:700">${esc(c.title || '审核处理中')}</div><div style="font-size:10.5px;color:#98A1B3;margin-top:3px">${esc(c.desc || '预计 30 分钟内完成，请耐心等待')}</div></div></div></div>`,

  tabbar: c => `<div class="comp" style="display:flex;background:var(--card);border-top:1px solid #EEF1F6;padding:8px 0 10px;flex-shrink:0">
    ${(c.items || [{icon:'home',label:'首页',on:1},{icon:'receipt',label:'订单'},{icon:'person',label:'我的'}]).map(t => `
    <div style="flex:1;text-align:center;color:${t.on ? 'var(--p)' : '#98A1B3'}"><div style="line-height:0;margin-bottom:3px">${mi(t.icon, 20)}</div>
    <div style="font-size:9.5px;font-weight:${t.on ? 700 : 400}">${esc(t.label)}</div></div>`).join('')}</div>`,
};

/* B 端组件库 */
const DSB = {
  bstats: c => `<div class="comp bstats" style="">${(c.items || []).map(i => `<div class="bstat"><div class="bs-l">${esc(i.label)}</div><div class="bs-v">${esc(i.value)}</div><div class="bs-t ${String(i.trend || '').includes('-') ? 'down' : 'up'}">${esc(i.trend || '')}</div></div>`).join('')}</div>`,
  bfilter: c => `<div class="comp bfilter" style="">${(c.fields || []).map(f => `<div class="bf-item"><span>${esc(f)}</span><i>请选择</i></div>`).join('')}<button class="bf-btn primary">查 询</button><button class="bf-btn">重 置</button></div>`,
  btable: c => `<div class="comp btable" style=""><div class="bt-row head">${(c.cols || []).map(x => `<div class="bt-cell">${esc(x)}</div>`).join('')}</div>${(c.rows || []).map(r => `<div class="bt-row">${r.map((cell, ci) => {
    if (/^(ok|warn|err):/.test(cell)){ const p = cell.split(':'); return `<div class="bt-cell"><span class="bt-pill ${p[0]}">${esc(p[1])}</span></div>`; }
    if (ci === r.length - 1 && c.cols && /操作/.test(c.cols[c.cols.length - 1])) return `<div class="bt-cell"><span class="bt-link">${esc(cell)}</span></div>`;
    return `<div class="bt-cell">${esc(cell)}</div>`;
  }).join('')}</div>`).join('')}</div>`,
  bpager: c => `<div class="comp bpager" style="">共 ${c.total || 0} 条<i>‹</i><i class="on">1</i><i>2</i><i>3</i><i>…</i><i>›</i></div>`,
  bform: c => `<div class="comp bform" style="">${(c.fields || []).map(f => `<div class="bfr"><label>${f.req ? '<em>*</em>' : ''}${esc(f.label)}</label><div class="bin">${esc(f.val || '请输入')}</div></div>`).join('')}</div>`,
  bfoot: c => `<div class="comp bfoot" style=""><button class="bf-btn">取 消</button><button class="bf-btn primary">${esc(c.text || '提 交')}</button></div>`,
  bdesc: c => `<div class="comp bdesc" style="">${c.title ? `<div class="bd-t">${esc(c.title)}</div>` : ''}<div class="bd-g">${(c.rows || []).map(r => `<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div></div>`,
  btabs: c => `<div class="comp btabs" style="">${(c.items || []).map((t, i) => `<i class="${i === (c.on || 0) ? 'on' : ''}">${esc(t)}</i>`).join('')}</div>`,
};
const B_MENU = ['工作台','订单管理','保单管理','核保管理','支付管理','数据报表'];

function resolvePrimary(spec){
  if (spec.theme && THEMES[spec.theme]) return THEMES[spec.theme].p;
  return spec.p || THEMES.blue.p;
}
function injectDelay(html, i){
  return html.replace(/class="comp([^"]*)" style="/, (s, g) => `class="comp${g}" style="--cd:${i * 0.08}s;`);
}

function renderPageBody(spec, animated){
  const p = resolvePrimary(spec);
  const wire = spec.wire ? ' wire' : '';
  if (spec.mode === 'b') return renderPageBodyB(spec, animated, p, wire);
  const comps = spec.comps.map((c, i) => {
    const fn = DS[c.type];
    if (!fn) return '';
    let html = fn(c);
    if (animated) html = injectDelay(html, i);
    return html;
  }).join('');
  return `<div class="pg${animated ? '' : ' noanim'}${wire}" style="--p:${p}">
    <div style="display:flex;justify-content:space-between;padding:7px 18px 3px;font-size:10.5px;font-weight:700;flex-shrink:0;background:${spec.comps[0] && ['navbar','search'].includes(spec.comps[0].type) ? 'var(--card)' : 'transparent'}"><span>9:41</span><span style="display:inline-flex;gap:4px;align-items:center;line-height:0">${mi('signal', 11)}${mi('battery', 13)}</span></div>
    <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column">${comps}</div>
  </div>`;
}

function renderPageBodyB(spec, animated, p, wire){
  const comps = spec.comps.map((c, i) => {
    const fn = DSB[c.type];
    if (!fn) return '';
    let html = fn(c);
    if (animated) html = injectDelay(html, i);
    return html;
  }).join('');
  return `<div class="pg bpg${animated ? '' : ' noanim'}${wire}" style="--p:${p}">
    <div class="btop"><span class="blogo"></span><b>${esc(spec.dsName || '管理后台')}</b><span class="bspace"></span><span class="bavatar">陈</span></div>
    <div class="bmain">
      <div class="bside">${B_MENU.map((m, i) => `<div class="bmenu${i === spec.menuIdx ? ' on' : ''}">${m}</div>`).join('')}</div>
      <div class="bbody"><div class="bcrumb">${esc(spec.crumb || ('首页 / ' + spec.title))}</div>${comps}</div>
    </div>
  </div>`;
}
function buildSpec(node, desc, cfg){
  cfg = cfg || { fw:'react', side:'c', ds:'gone-c', pt:'auto' };
  const ds = DS_MAP[cfg.ds] || DS_MAP['gone-c'];
  if (cfg.side === 'b') return buildSpecB(node, desc, cfg, ds);
  // 指定了页面类型则强制按该类型生成，否则按节点语义推断
  const text = cfg.pt !== 'auto' ? (PT_KEYWORDS[cfg.pt] + ' ' + desc) : (node.title + ' ' + (node.desc || '') + ' ' + desc);
  const t = node.title.replace(/页$|页面$/, '');
  let spec = { title: node.title, mode:'c', p: ds.p, wire: !!ds.wire, dsName: ds.name, comps: [] };

  const has = re => re.test(text);

  if (has(/首页|频道/)){
    spec.comps = [
      { type:'search', placeholder:'搜索保障 / 服务' },
      { type:'banner', title: t + '，一键直达', subtitle:'新用户专享福利，限时开放', btn:'立即体验' },
      { type:'notice', text:'已有 1,286,000 位用户在这里完成办理' },
      { type:'grid', items:[{icon:'car',label:'车险'},{icon:'health',label:'健康险'},{icon:'flight',label:'旅行险'},{icon:'home',label:'家财险'},{icon:'receipt',label:'我的保单'},{icon:'gift',label:'福利中心'},{icon:'headset',label:'在线客服'},{icon:'tune',label:'更多'}] },
      { type:'cards', items:[
        {icon:'car',title:'车险优选',desc:'交强险+商业险一站式投保',price:'950',tag:'热销'},
        {icon:'health',title:'百万医疗险',desc:'最高 600 万医疗保障',price:'136'},
      ]},
      { type:'tabbar' },
    ];
  } else if (has(/报价|试算/)){
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'steps', items:['填写信息','获取报价','确认投保','支付'], active:0 },
      { type:'form', fields:[
        {label:'车牌号码', value:'粤A · 88888'},
        {label:'车主姓名', placeholder:'请输入车主姓名'},
        {label:'车辆品牌', value:'比亚迪 汉 EV', arrow:1},
        {label:'初登日期', placeholder:'请选择日期', arrow:1},
      ]},
      { type:'notice', text:'信息仅用于报价，全程加密保护' },
      { type:'button', text:'立即获取报价', sub:'预计 10 秒出结果' },
    ];
  } else if (has(/方案|对比|套餐/)){
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'steps', items:['填写信息','获取报价','确认投保','支付'], active:1 },
      { type:'plans', items:[
        {title:'基础版', price:'950', desc:'交强险+三者100万'},
        {title:'优享版', price:'1,280', desc:'含车损+三者200万'},
        {title:'尊享版', price:'1,680', desc:'全险+增值服务'},
      ]},
      { type:'info', title:'优享版保障明细', rows:[
        {k:'机动车损失险', v:'投保'},
        {k:'第三者责任险', v:'200 万'},
        {k:'医保外用药责任险', v:'1 万'},
        {k:'道路救援服务', v:'不限次'},
      ]},
      { type:'button', text:'选定方案，去投保' },
    ];
  } else if (has(/填写|信息录入|资料/) && !has(/确认/)){
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'steps', items:['填写信息','获取报价','确认投保','支付'], active:2 },
      { type:'form', fields:[
        {label:'车主姓名', value:'陈**'},
        {label:'身份证号', placeholder:'请输入身份证号'},
        {label:'手机号码', value:'138****8888'},
        {label:'行驶证', placeholder:'拍照上传', arrow:1},
        {label:'起保日期', value:'2026-08-15', arrow:1},
      ]},
      { type:'agreement' },
      { type:'button', text:'下一步' },
    ];
  } else if (has(/确认单|确认页|核对|订单确认|投保单/)){
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'info', title:'投保信息', rows:[
        {k:'投保方案', v:'优享版'},
        {k:'被保险人', v:'陈**'},
        {k:'车牌号码', v:'粤A·88888'},
        {k:'保障期间', v:'2026-08-15 起 1 年'},
      ]},
      { type:'info', title:'费用明细', rows:[
        {k:'交强险', v:'¥950.00'},
        {k:'商业险', v:'¥1,280.00'},
        {k:'优惠减免', v:'-¥180.00'},
      ]},
      { type:'agreement', text:'《投保须知》《保险条款》《免责说明》' },
      { type:'button', text:'确认投保 ¥2,050.00' },
    ];
  } else if (has(/核保|审核|等待/)){
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'progress', title:'人工核保处理中', desc:'预计 30 分钟内完成，结果将短信通知' },
      { type:'steps', items:['提交投保','人工核保','完成支付'], active:1 },
      { type:'info', title:'投保单信息', rows:[
        {k:'投保单号', v:'TB20260731088'},
        {k:'提交时间', v:'今天 14:32'},
        {k:'预计完成', v:'今天 15:02 前'},
      ]},
      { type:'notice', text:'审核期间保费不会扣除，请放心等待' },
      { type:'button', text:'返回首页' },
    ];
  } else if (has(/支付|收银/) && !has(/成功|失败|结果/)){
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'amount', value:'2,050.00', label:'需支付保费', tip:'限时立减 ¥180' },
      { type:'paylist' },
      { type:'agreement', text:'《支付服务协议》' },
      { type:'button', text:'立即支付', sub:'支付剩余时间 14:59' },
    ];
  } else if (has(/成功|完成页/)){
    spec.theme = 'green';
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'result', title:'投保成功', desc:'保单号 P20260731666888\n电子保单已发送至您的邮箱' },
      { type:'info', title:'保单信息', rows:[
        {k:'保障方案', v:'优享版'},
        {k:'生效时间', v:'2026-08-15 00:00'},
        {k:'支付金额', v:'¥2,050.00'},
      ]},
      { type:'coupon', title:'续保专享券已到账', desc:'明年续保立减 100 元' },
      { type:'button', text:'查看我的保单' },
    ];
  } else if (has(/失败/)){
    spec.theme = 'red';
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'result', status:'fail', title:'支付未完成', desc:'银行卡余额不足，请更换支付方式后重试' },
      { type:'paylist' },
      { type:'button', text:'重新支付' },
    ];
  } else if (has(/保单详情|订单详情|详情/)){
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'banner', title:'优享版 · 保障中', subtitle:'保单号 P20260731666888' },
      { type:'info', title:'保障权益', rows:[
        {k:'机动车损失险', v:'已生效'},
        {k:'第三者责任险 200万', v:'已生效'},
        {k:'道路救援', v:'不限次数'},
      ]},
      { type:'grid', items:[{icon:'doc',label:'电子保单'},{icon:'wrench',label:'道路救援'},{icon:'call',label:'一键报案'},{icon:'headset',label:'在线客服'}] },
      { type:'button', text:'申请理赔' },
    ];
  } else if (has(/登录|注册/)){
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'banner', title:'欢迎回来', subtitle:'登录后可同步保单与订单数据' },
      { type:'form', fields:[
        {label:'手机号', placeholder:'请输入手机号'},
        {label:'验证码', placeholder:'请输入验证码'},
      ]},
      { type:'agreement', text:'《用户协议》《隐私政策》' },
      { type:'button', text:'登录 / 注册' },
    ];
  } else if (has(/验证码/)){
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'form', fields:[{label:'验证码', placeholder:'已发送至 138****8888'}] },
      { type:'notice', text:'56 秒后可重新发送' },
      { type:'button', text:'确认' },
    ];
  } else if (has(/购物车/)){
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'cards', items:[
        {icon:'box',title:'运动跑鞋 轻盈缓震款',desc:'白色 · 42码 · x1',price:'399'},
        {icon:'headset',title:'无线降噪耳机 Pro',desc:'星空黑 · x1',price:'899',tag:'满减'},
      ]},
      { type:'coupon', title:'满 1000 减 80', desc:'还差 ¥2 可用，去凑单' },
      { type:'button', text:'去结算 ¥1,298' },
    ];
  } else if (has(/列表|搜索|商家|结果页/)){
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'search', placeholder:'搜索' },
      { type:'cards', items:[
        {icon:'store',title:'优选商家 A',desc:'评分 4.9 · 月售 2000+ · 1.2km',price:'20',tag:'满减'},
        {icon:'store',title:'优选商家 B',desc:'评分 4.8 · 月售 1500+ · 0.8km',price:'15'},
        {icon:'store',title:'优选商家 C',desc:'评分 4.7 · 月售 900+ · 2.1km',price:'25',tag:'新店'},
      ]},
      { type:'tabbar' },
    ];
  } else if (has(/跟踪|物流|骑手/)){
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'banner', title:'骑手正在配送', subtitle:'预计 18:32 送达 · 距您 1.2km' },
      { type:'steps', items:['已接单','已取餐','配送中','已送达'], active:2 },
      { type:'info', title:'订单信息', rows:[
        {k:'配送地址', v:'科技园南区 A 座'},
        {k:'骑手', v:'王师傅 138****6666'},
      ]},
      { type:'button', text:'联系骑手' },
    ];
  } else {
    spec.comps = [
      { type:'navbar', title: node.title },
      { type:'banner', title: t, subtitle: node.desc || '根据描述自动生成的页面' },
      { type:'cards', items:[
        {icon:'star', title:'核心内容模块', desc:'根据节点语义自动匹配的内容卡片'},
        {icon:'pin', title:'次要信息模块', desc:'可在左侧对话继续调整'},
      ]},
      { type:'button', text:'主操作' },
    ];
  }

  applyThemeFromText(spec, desc);
  return spec;
}

/* B 端页面 spec 生成 */
function buildSpecB(node, desc, cfg, ds){
  const text = cfg.pt !== 'auto' ? (PT_KEYWORDS[cfg.pt] + ' ' + desc) : (node.title + ' ' + (node.desc || '') + ' ' + desc);
  const has = re => re.test(text);
  const spec = { title: node.title, mode:'b', p: ds.p, wire: !!ds.wire, dsName: ds.name, menuIdx: 1, crumb: '', comps: [] };

  if (has(/核保|审核|风控/)){
    spec.menuIdx = 3; spec.crumb = '核保管理 / 核保工作台';
    spec.comps = [
      { type:'btabs', items:['待审核 (12)','已通过','已拒绝'], on:0 },
      { type:'btable', cols:['投保单号','投保人','方案','保费','风险等级','状态','操作'], rows:[
        ['TB2026073101','陈**','优享版','¥2,050','中','warn:待审核','审核'],
        ['TB2026073102','李**','基础版','¥950','低','warn:待审核','审核'],
        ['TB2026073099','王**','尊享版','¥1,680','低','ok:已通过','详情'],
        ['TB2026073095','赵**','优享版','¥1,280','高','err:已拒绝','详情'],
      ]},
      { type:'bpager', total: 126 },
    ];
  } else if (has(/支付|收银|交易|流水/)){
    spec.menuIdx = 4; spec.crumb = '支付管理 / 交易流水';
    spec.comps = [
      { type:'bstats', items:[{label:'今日交易额',value:'¥1,286,420',trend:'+12.6%'},{label:'成功率',value:'99.2%',trend:'+0.3%'},{label:'交易笔数',value:'8,652',trend:'+8.1%'},{label:'退款笔数',value:'12',trend:'-25%'}] },
      { type:'bfilter', fields:['交易单号','支付渠道','交易时间'] },
      { type:'btable', cols:['交易单号','渠道','金额','时间','状态','操作'], rows:[
        ['PAY20260731688','微信支付','¥2,050.00','14:32:05','ok:成功','详情'],
        ['PAY20260731687','支付宝','¥950.00','14:31:42','ok:成功','详情'],
        ['PAY20260731686','银行卡','¥1,680.00','14:30:18','warn:处理中','详情'],
        ['PAY20260731685','微信支付','¥1,280.00','14:28:55','err:失败','重试'],
      ]},
      { type:'bpager', total: 8652 },
    ];
  } else if (has(/填写|表单|新建|录入|资料/) && !has(/详情|确认/)){
    spec.crumb = '订单管理 / 新建投保单';
    spec.comps = [
      { type:'bform', fields:[
        {label:'投保人', req:1, val:'请输入投保人姓名'},
        {label:'证件号码', req:1, val:'请输入身份证号'},
        {label:'投保方案', req:1, val:'请选择方案'},
        {label:'车牌号码', req:1, val:'请输入车牌号'},
        {label:'起保日期', req:1, val:'请选择日期'},
        {label:'备注', val:'选填'},
      ]},
      { type:'bfoot', text:'提 交' },
    ];
  } else if (has(/详情|确认|保单/)){
    spec.menuIdx = 2; spec.crumb = '保单管理 / 保单详情';
    spec.comps = [
      { type:'bdesc', title:'基本信息', rows:[['保单号','P20260731666888'],['投保人','陈**'],['方案','优享版'],['状态','保障中'],['生效时间','2026-08-15'],['保费','¥2,050.00']] },
      { type:'btable', cols:['险种','保额','状态'], rows:[['机动车损失险','按车价','ok:已生效'],['第三者责任险','¥200万','ok:已生效'],['道路救援','不限次','ok:已生效']] },
      { type:'bfoot', text:'下载电子保单' },
    ];
  } else if (has(/首页|工作台|概览/)){
    spec.menuIdx = 0; spec.crumb = '工作台';
    spec.comps = [
      { type:'bstats', items:[{label:'今日新增保单',value:'286',trend:'+12%'},{label:'待核保',value:'12',trend:'-8%'},{label:'今日保费',value:'¥58.6万',trend:'+15%'},{label:'理赔中',value:'6',trend:'0%'}] },
      { type:'btable', cols:['待办事项','提交人','时间','状态','操作'], rows:[
        ['人工核保 TB2026073101','陈**','14:32','warn:待处理','处理'],
        ['退款审批 PAY20260731685','李**','13:20','warn:待处理','处理'],
        ['保单批改申请','王**','11:05','ok:已完成','查看'],
      ]},
    ];
  } else {
    spec.crumb = '订单管理 / ' + node.title;
    spec.comps = [
      { type:'bstats', items:[{label:'总数',value:'1,286',trend:'+6%'},{label:'进行中',value:'86',trend:'+2%'},{label:'已完成',value:'1,180',trend:'+7%'},{label:'异常',value:'20',trend:'-12%'}] },
      { type:'bfilter', fields:['单号','状态','创建时间'] },
      { type:'btable', cols:['单号','用户','金额','创建时间','状态','操作'], rows:[
        ['NO2026073101','陈**','¥2,050','07-31 14:32','ok:已完成','详情'],
        ['NO2026073102','李**','¥950','07-31 14:20','warn:进行中','详情'],
        ['NO2026073103','王**','¥1,680','07-31 13:58','ok:已完成','详情'],
        ['NO2026073104','赵**','¥1,280','07-31 13:40','err:已取消','详情'],
      ]},
      { type:'bpager', total: 1286 },
    ];
  }
  applyThemeFromText(spec, desc);
  return spec;
}

function applyThemeFromText(spec, text){
  if (/橙/.test(text)) spec.theme = 'orange';
  else if (/绿/.test(text)) spec.theme = 'green';
  else if (/红/.test(text)) spec.theme = 'red';
  else if (/紫/.test(text)) spec.theme = 'purple';
  else if (/蓝/.test(text)) spec.theme = 'blue';
}

/* 迭代修改指令 */
function tryModify(spec, text){
  const changes = [];
  const themed = /[橙绿红紫蓝]/.test(text) && /色|主题/.test(text);
  if (themed){
    applyThemeFromText(spec, text);
    changes.push('主题色切换为' + THEMES[spec.theme].name);
  }
  const addMapC = [
    [/轮播|banner|横幅|广告位/i, { type:'banner', title:'限时活动', subtitle:'新用户专享，立省 180 元', btn:'去看看' }, '活动 Banner', 1],
    [/公告|通知/, { type:'notice', text:'系统公告：服务升级，体验更流畅' }, '公告栏', 1],
    [/优惠券|券/, { type:'coupon' }, '优惠券卡片', 1],
    [/步骤|进度条/, { type:'steps', items:['第一步','第二步','第三步'], active:1 }, '步骤条', 1],
    [/客服/, { type:'cards', items:[{icon:'headset', title:'在线客服', desc:'7×24 小时为您服务'}] }, '客服入口', 0],
    [/表单|输入/, { type:'form', fields:[{label:'新增字段', placeholder:'请输入'}] }, '表单区块', 0],
  ];
  const addMapB = [
    [/统计|数据卡|指标/, { type:'bstats', items:[{label:'新增指标',value:'1,024',trend:'+9%'},{label:'环比',value:'86%',trend:'+3%'},{label:'转化率',value:'32.5%',trend:'+1.2%'},{label:'异常数',value:'3',trend:'-40%'}] }, '统计卡片', 1],
    [/页签|tab/i, { type:'btabs', items:['全部','进行中','已完成'], on:0 }, '页签', 1],
    [/筛选|搜索/, { type:'bfilter', fields:['关键词','状态','时间'] }, '筛选栏', 1],
    [/表单|输入/, { type:'bform', fields:[{label:'新增字段', val:'请输入'}] }, '表单面板', 0],
  ];
  const addMap = spec.mode === 'b' ? addMapB : addMapC;
  const btnType = spec.mode === 'b' ? 'bfoot' : 'button';
  if (/加|添加|新增|放一个|来一个/.test(text)){
    for (const [re, comp, name, atTop] of addMap){
      if (re.test(text)){
        const idx = spec.comps.findIndex(c => c.type === btnType);
        const insertAt = atTop ? Math.min(1, spec.comps.length) : (idx === -1 ? spec.comps.length : idx);
        spec.comps.splice(insertAt, 0, JSON.parse(JSON.stringify(comp)));
        changes.push('新增「' + name + '」组件');
        break;
      }
    }
  }
  if (/去掉|删除|移除/.test(text)){
    const delMap = [ [/轮播|banner|横幅/i, 'banner', 'Banner'], [/公告/, 'notice', '公告栏'], [/券/, 'coupon', '优惠券'], [/步骤/, 'steps', '步骤条'], [/搜索/, 'search', '搜索框'] ];
    for (const [re, type, name] of delMap){
      if (re.test(text)){
        const i = spec.comps.findIndex(c => c.type === type);
        if (i > -1){ spec.comps.splice(i, 1); changes.push('移除「' + name + '」组件'); }
        break;
      }
    }
  }
  const tm = text.match(/标题(?:改成|改为|换成)[「"']?([^」"'，。]+)/);
  if (tm){
    const nav = spec.comps.find(c => c.type === 'navbar');
    if (nav) nav.title = tm[1];
    spec.title = tm[1];
    changes.push('标题更新为「' + tm[1] + '」');
  }
  return changes;
}


export { buildSpec, renderPageBody, esc, mi, DS_MAP };
