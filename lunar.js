/**
 * 农历/干支/生肖/节气 本地计算库
 * 数据表覆盖 1900-2100 年，公历↔农历转换、二十四节气均为天文历法算法，结果精确。
 * 无外部依赖，纯本地计算。
 */
(function (global) {
  'use strict';

  // 1900-2100 每年农历信息编码表
  // 每个数字用位表示：闰月大小 + 12/13 个月的大小月 + 闰几月
  var lunarInfo = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520
  ];

  var Gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var Zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var Animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  var nStr1 = ['日', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  var nStr2 = ['初', '十', '廿', '卅'];
  var nStr3 = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

  // 返回农历 y 年一整年的总天数
  function lYearDays(y) {
    var i, sum = 348;
    for (i = 0x8000; i > 0x8; i >>= 1) sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
    return sum + leapDays(y);
  }
  // 返回农历 y 年闰月的天数（无闰月返回 0）
  function leapDays(y) {
    if (leapMonth(y)) return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
    return 0;
  }
  // 返回农历 y 年闰哪个月（1-12，没有返回 0）
  function leapMonth(y) {
    return lunarInfo[y - 1900] & 0xf;
  }
  // 返回农历 y 年 m 月（非闰月）的天数
  function monthDays(y, m) {
    return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
  }

  // 24 节气数据（1900-2100），单位分钟偏移
  var sTermInfo = [
    0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693,
    263343, 285989, 308563, 331033, 353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758
  ];
  var solarTerm = [
    '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
    '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
  ];

  // 返回 y 年第 n 个节气(0-23)是几号
  function sTerm(y, n) {
    var offDate = new Date((31556925974.7 * (y - 1900) + sTermInfo[n] * 60000) + Date.UTC(1900, 0, 6, 2, 5, 0));
    return offDate.getUTCDate();
  }

  // 数字转中文日
  function toChinaDay(d) {
    var s;
    switch (d) {
      case 10: s = '初十'; break;
      case 20: s = '二十'; break;
      case 30: s = '三十'; break;
      default:
        s = nStr2[Math.floor(d / 10)];
        s += nStr1[d % 10];
    }
    return s;
  }

  // 天干地支
  function toGanZhi(offset) {
    return Gan[offset % 10] + Zhi[offset % 12];
  }

  /**
   * 主函数：传入公历 Date，返回农历完整信息
   */
  function solar2lunar(date) {
    var objDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var baseDate = new Date(1900, 0, 31); // 1900-01-31 是农历 1900 正月初一
    var offset = Math.round((objDate - baseDate) / 86400000);

    // 1) 定位农历年：逐年扣除该年总天数，扣不动时即当前农历年
    var lunarYear = 1900;
    var daysOfYear = 0;
    while (lunarYear < 2101) {
      daysOfYear = lYearDays(lunarYear);
      if (offset < daysOfYear) break;
      offset -= daysOfYear;
      lunarYear++;
    }

    // 2) 定位农历月：按 正月 … 第leap月、[闰leap月] … 十二月 的顺序扣除各月天数。
    //    闰月紧跟在第 leap 个月之后。用 isLeap 标记“当前扣的是不是闰月”。
    var leap = leapMonth(lunarYear); // 该年闰几月（0 表示无闰月）
    var isLeap = false;
    var lunarMonth = 1;
    var i = 1;
    while (i <= 13) {
      var monthLen = isLeap ? leapDays(lunarYear) : monthDays(lunarYear, i);
      if (offset < monthLen) {
        lunarMonth = i;
        break;
      }
      offset -= monthLen;
      // 决定“下一次”扣哪个月：刚扣完第 leap 个普通月，则下一轮扣闰月；
      // 刚扣完闰月，则回到第 leap 个月的下一个普通月。
      if (!isLeap && leap > 0 && i === leap) {
        isLeap = true;      // 下一轮扣 闰leap月，i 不变
      } else {
        isLeap = false;     // 下一轮扣普通月
        i++;
      }
    }
    var lunarDay = offset + 1;

    // 干支纪年（以正月初一为界，常用民历口径）。1900 年为庚子年，庚子在六十甲子中序号 36。
    var gzYear = toGanZhi((lunarYear - 1900 + 36) % 60);
    var animal = Animals[(lunarYear - 1900) % 12];

    // 干支纪日
    var dayCyclical = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0) / 86400000 + 25567 + 10;
    var gzDay = toGanZhi(dayCyclical);

    // 当天是否为节气
    var firstTerm = sTerm(date.getFullYear(), date.getMonth() * 2);
    var secondTerm = sTerm(date.getFullYear(), date.getMonth() * 2 + 1);
    var term = '';
    if (firstTerm === date.getDate()) term = solarTerm[date.getMonth() * 2];
    if (secondTerm === date.getDate()) term = solarTerm[date.getMonth() * 2 + 1];

    var monthCn = (isLeap ? '闰' : '') + nStr3[lunarMonth - 1] + '月';
    var dayCn = toChinaDay(lunarDay);

    return {
      lunarYear: lunarYear,
      lunarMonth: lunarMonth,
      lunarDay: lunarDay,
      isLeap: isLeap,
      gzYear: gzYear,       // 干支年，如 甲辰
      animal: animal,       // 生肖
      gzDay: gzDay,         // 干支日
      monthCn: monthCn,     // 农历月中文，如 正月/闰四月
      dayCn: dayCn,         // 农历日中文，如 初一/廿三
      term: term,           // 当天节气（没有则空）
      lunarText: monthCn + dayCn
    };
  }

  var api = { solar2lunar: solar2lunar, Animals: Animals };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Lunar = api;
})(typeof window !== 'undefined' ? window : this);
