// ============================================================
// 老黄历 iOS 小组件 · Scriptable 脚本
// 桌面直接显示今天的 宜/忌/冲煞，不用点开
// 数据来源：天行数据 lunar 接口（已内置你的 key）
// ------------------------------------------------------------
// 用法：把整段复制进 Scriptable 新建的脚本里，运行一次看效果，
//      然后在桌面添加 Scriptable 小组件并选择本脚本。
// ============================================================

const API_KEY = "6d05ac912c21f8ad4d02157947924486";

// —— 颜色主题（红金老黄历风）——
const RED       = new Color("#8a1f11");
const RED_LIGHT = new Color("#b23a2a");
const PAPER     = new Color("#fbf5e9");
const GOLD      = new Color("#f0d28a");
const INK       = new Color("#fbf5e9");
const GOOD      = new Color("#7CFC9A");
const BAD       = new Color("#ff9a8a");

// —— 取今天日期 yyyy-MM-dd ——
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// —— 拉黄历数据 ——
async function fetchHuangli() {
  const url = `https://apis.tianapi.com/lunar/index?key=${API_KEY}&date=${todayStr()}`;
  try {
    const req = new Request(url);
    const json = await req.loadJSON();
    if (!json || json.code !== 200 || !json.result) return null;
    return json.result;
  } catch (e) {
    return null;
  }
}

// —— 截断长文本 ——
function clip(s, n) {
  if (!s) return "—";
  s = String(s).trim();
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// —— 构建小组件 ——
async function buildWidget() {
  const w = new ListWidget();

  // 背景渐变
  const g = new LinearGradient();
  g.colors = [RED, RED_LIGHT];
  g.locations = [0, 1];
  w.backgroundGradient = g;
  w.setPadding(14, 16, 14, 16);

  const data = await fetchHuangli();

  if (!data) {
    const t = w.addText("黄历加载失败\n检查网络或额度");
    t.textColor = INK;
    t.font = Font.mediumSystemFont(14);
    return w;
  }

  // 顶部：公历日 + 农历
  const d = new Date();
  const top = w.addStack();
  top.centerAlignContent();

  const dayNum = top.addText(String(d.getDate()));
  dayNum.textColor = GOLD;
  dayNum.font = Font.boldSystemFont(34);

  top.addSpacer(8);

  const rt = top.addStack();
  rt.layoutVertically();
  const lunarLine = rt.addText(`${data.lmonthname || ""} ${data.lunarday || ""}`);
  lunarLine.textColor = INK;
  lunarLine.font = Font.mediumSystemFont(13);
  const gzLine = rt.addText(`${data.tiangandizhiyear || ""}年 · 属${data.shengxiao || ""}`);
  gzLine.textColor = new Color("#f0d28a", 0.85);
  gzLine.font = Font.systemFont(11);

  top.addSpacer();

  w.addSpacer(8);

  // 宜
  const yiStack = w.addStack();
  yiStack.centerAlignContent();
  const yiTag = yiStack.addText("宜 ");
  yiTag.textColor = GOOD;
  yiTag.font = Font.boldSystemFont(13);
  const yiText = yiStack.addText(clip(data.fitness, 18));
  yiText.textColor = INK;
  yiText.font = Font.systemFont(13);

  w.addSpacer(4);

  // 忌
  const jiStack = w.addStack();
  jiStack.centerAlignContent();
  const jiTag = jiStack.addText("忌 ");
  jiTag.textColor = BAD;
  jiTag.font = Font.boldSystemFont(13);
  const jiText = jiStack.addText(clip(data.taboo, 18));
  jiText.textColor = INK;
  jiText.font = Font.systemFont(13);

  w.addSpacer(6);

  // 底部：冲煞 + 财神
  const caishen = (data.shenwei || "").match(/财神：?([东南西北]+)/);
  const bottom = w.addText(
    `冲煞 ${clip(data.chongsha, 14)}` + (caishen ? `  ·  财神${caishen[1]}` : "")
  );
  bottom.textColor = new Color("#f0d28a", 0.9);
  bottom.font = Font.systemFont(11);

  w.addSpacer();

  // 每 3 小时刷新一次
  w.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 60 * 3);
  return w;
}

// —— 运行 ——
const widget = await buildWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // 在 App 里手动运行时，弹出中等尺寸预览
  await widget.presentMedium();
}

Script.complete();
