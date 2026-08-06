// @ts-nocheck
/* eslint-disable */
/* 从 FlowCraft demo 移植：一句话/PRD → 流程图模板与解析（mock），及拓扑分层布局 */
function T(id, type, title, desc){ return { id, type, title, desc }; }
function E(from, to, label){ return { from, to, label }; }

const TEMPLATES = [
  {
    match: /车险|保险|投保|保单/,
    name: '车险投保流程',
    nodes: [
      T('s','start','车险频道首页','App 内车险入口，展示营销位与报价入口'),
      T('quote','page','报价试算页','输入车牌 / 车型，一键获取报价'),
      T('plans','page','方案对比页','基础 / 优享 / 尊享三档方案对比'),
      T('info','page','投保信息填写页','车主信息、行驶证信息录入'),
      T('confirm','page','投保单确认页','核对投保信息与条款'),
      T('uw','branch','核保判断','系统自动核保，判断是否需人工审核'),
      T('manual','page','人工核保等待页','展示审核进度，预计 30 分钟'),
      T('pay','page','支付收银台','选择支付方式，完成保费支付'),
      T('success','page','投保成功页','出单成功，展示保单号'),
      T('policy','end','保单详情页','查看电子保单与保障权益'),
    ],
    edges: [
      E('s','quote','获取报价'), E('quote','plans'), E('plans','info','选定方案'),
      E('info','confirm'), E('confirm','uw','提交投保'),
      E('uw','pay','核保通过'), E('uw','manual','需人工核保'), E('manual','pay','审核通过'),
      E('pay','success','支付成功'), E('success','policy'),
    ],
  },
  {
    match: /电商|商城|购物|下单|买/,
    name: '电商购物下单流程',
    nodes: [
      T('s','start','商城首页','搜索、金刚位、推荐商品流'),
      T('list','page','搜索结果页','商品列表，支持筛选排序'),
      T('detail','page','商品详情页','主图、价格、评价、规格选择'),
      T('cart','page','购物车','商品管理、优惠凑单'),
      T('order','page','订单确认页','地址、优惠券、运费明细'),
      T('pay','page','收银台','微信 / 支付宝 / 余额支付'),
      T('payres','branch','支付结果判断','轮询支付状态'),
      T('success','page','支付成功页','展示订单信息与推荐'),
      T('fail','page','支付失败页','失败原因与重试入口'),
      T('odetail','end','订单详情页','物流跟踪与售后入口'),
    ],
    edges: [
      E('s','list','搜索商品'), E('list','detail'), E('detail','cart','加入购物车'),
      E('detail','order','立即购买'), E('cart','order','去结算'),
      E('order','pay','提交订单'), E('pay','payres'),
      E('payres','success','成功'), E('payres','fail','失败'),
      E('fail','pay','重新支付'), E('success','odetail'),
    ],
  },
  {
    match: /登录|注册|账号/,
    name: 'App 登录注册流程',
    nodes: [
      T('splash','start','启动页','品牌闪屏，检测登录态'),
      T('login','page','登录页','手机号输入 + 协议勾选'),
      T('sms','page','验证码输入页','6 位短信验证码'),
      T('pwd','page','密码登录页','账号密码登录，支持找回'),
      T('isnew','branch','是否新用户','判断手机号是否已注册'),
      T('profile','page','完善资料页','昵称、头像、兴趣标签'),
      T('home','end','App 首页','登录完成，进入主流程'),
    ],
    edges: [
      E('splash','login','未登录'), E('login','sms','获取验证码'), E('login','pwd','密码登录'),
      E('sms','isnew','验证通过'), E('pwd','home','登录成功'),
      E('isnew','profile','新用户'), E('isnew','home','老用户'), E('profile','home','完成'),
    ],
  },
  {
    match: /外卖|点餐|餐|奶茶|咖啡/,
    name: '外卖点餐流程',
    nodes: [
      T('s','start','外卖首页','定位地址、分类金刚位、推荐商家'),
      T('list','page','商家列表页','距离 / 销量 / 评分排序'),
      T('shop','page','店铺详情页','菜单浏览、规格选择'),
      T('cart','modal','购物车弹窗','半屏弹窗，管理已选商品'),
      T('order','page','订单确认页','地址、配送时间、备注'),
      T('pay','page','收银台','支付方式选择'),
      T('track','page','订单跟踪页','骑手位置实时地图'),
      T('done','end','订单完成页','确认收货与评价入口'),
    ],
    edges: [
      E('s','list','选择分类'), E('list','shop'), E('shop','cart','加购'),
      E('cart','order','去结算'), E('order','pay','提交订单'),
      E('pay','track','支付成功'), E('track','done','已送达'),
    ],
  },
];

const GENERIC_TEMPLATE = (topic) => ({
  name: topic + '流程',
  nodes: [
    T('s','start', topic + '首页', '流程入口，展示核心功能'),
    T('list','page','列表页','内容列表，支持筛选'),
    T('detail','page','详情页','完整信息展示与操作入口'),
    T('form','page','信息填写页','表单录入关键信息'),
    T('confirm','modal','确认弹窗','二次确认关键操作'),
    T('result','end','结果页','操作完成反馈'),
  ],
  edges: [ E('s','list'), E('list','detail'), E('detail','form','发起操作'), E('form','confirm','提交'), E('confirm','result','确认') ],
});

const SAMPLE_PRD = `车险投保功能 PRD（节选）

一、需求背景
为提升车险线上化率，在 App 内新增车险自助投保能力，覆盖报价、投保、支付全流程。

二、页面流程说明
1. 用户从车险频道首页进入，点击"立即报价"进入报价试算页；
2. 报价试算页支持输入车牌号自动带出车型，生成报价后进入方案对比页；
3. 方案对比页展示基础版 / 优享版 / 尊享版三档，用户选定后进入投保信息填写页；
4. 投保信息填写页录入车主身份证、行驶证信息，提交后进入投保单确认页；
5. 确认无误提交核保。若核保通过直接进入支付收银台；若命中人工核保规则，进入人工核保等待页；
6. 支付完成后展示投保成功页，可跳转保单详情页查看电子保单。

三、异常场景
- 支付失败时停留在收银台并提示失败原因，支持更换支付方式重试。`;

function parsePrd(text){
  const re = /([一-龥A-Za-z0-9]{1,12}?(?:页面|弹窗|浮层|收银台|首页|等待页|结果页|成功页|失败页|详情页|列表页|确认页|填写页|对比页|试算页|跟踪页|完成页|登录页|注册页|页))/g;
  const seen = new Set(), names = [];
  let m;
  while ((m = re.exec(text)) && names.length < 14){
    // 去掉动词性前缀：取最后一个连接词之后的部分作为页面名
    let name = m[1].split(/(?:从|后|时|若|则|即|且|并|可|直接|进入|停留在|跳转到?|随|先|再|接着|然后|将|会|需|击|自)/).pop();
    name = name.replace(/^(?:的|一个|新增|展示|打开|返回)+/, '');
    if (name.length < 2 || seen.has(name)) continue;
    // 与已有名称互为后缀的视为同一页面（如「收银台」vs「支付收银台」）
    if (names.some(n => n.endsWith(name) || name.endsWith(n))) continue;
    seen.add(name);
    names.push(name);
  }
  if (names.length < 3){
    const kw = TEMPLATES.find(t => t.match.test(text));
    if (kw) return kw;
    return GENERIC_TEMPLATE('产品');
  }
  const nodes = names.map((name, i) => {
    let type = 'page';
    if (i === 0) type = 'start';
    else if (/弹窗|浮层/.test(name)) type = 'modal';
    else if (i === names.length - 1) type = 'end';
    return T('p' + i, type, name, guessDesc(name));
  });
  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) edges.push(E(nodes[i].id, nodes[i + 1].id));
  return { name: 'PRD 解析结果', nodes, edges };
}

function guessDesc(name){
  if (/首页/.test(name)) return '流程入口页面';
  if (/报价|试算/.test(name)) return '输入信息获取报价';
  if (/对比|方案/.test(name)) return '多方案对比选择';
  if (/填写|信息/.test(name)) return '表单信息录入';
  if (/确认/.test(name)) return '信息核对与确认';
  if (/核保|审核|等待/.test(name)) return '审核进度展示';
  if (/收银|支付/.test(name)) return '支付方式选择与支付';
  if (/成功/.test(name)) return '操作成功反馈';
  if (/失败/.test(name)) return '失败原因与重试';
  if (/详情/.test(name)) return '完整信息展示';
  return '从 PRD 中识别的页面';
}

function layoutFlow(flow){
  // 分层：依赖最长路径
  const depth = {}, indeg = {};
  flow.nodes.forEach(n => { depth[n.id] = 0; indeg[n.id] = 0; });
  flow.edges.forEach(e => indeg[e.to]++);
  // 迭代松弛（简单 DAG 分层，容忍回边）
  for (let i = 0; i < flow.nodes.length; i++){
    flow.edges.forEach(e => {
      if (depth[e.from] + 1 > depth[e.to] && depth[e.from] < flow.nodes.length) {
        // 跳过明显的回边（to 的入度为多且已有更小深度且 from 深度较大时的循环）
        if (depth[e.to] <= depth[e.from]) depth[e.to] = Math.min(depth[e.from] + 1, flow.nodes.length);
      }
    });
  }
  // 只定分层，真正的坐标交给 relayout() 按节点实测尺寸算
  flow.nodes.forEach(n => n.depth = depth[n.id]);
}


export { TEMPLATES, GENERIC_TEMPLATE, SAMPLE_PRD, parsePrd, guessDesc, layoutFlow };
