/**
 * 老黄历 H5 主逻辑
 * - 农历/干支/生肖/节气：本地 lunar.js 计算（精确、离线）
 * - 宜忌/冲煞/值神：联网拉取（可在 API_LIST 配置多个接口，按顺序降级尝试）
 */
(function () {
  'use strict';

  var weekCn = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  // 当前显示的日期
  var current = new Date();

  // ================== 联网黄历接口配置 ==================
  // 说明：宜忌/冲煞没有公开权威算法，需要联网接口。国内主流免费接口（聚合/天行/极速数据）
  //       都要注册拿 key，有免费额度。下面预置了这些平台的“适配器”，你申请到 key 后，
  //       在 API_CONFIG 里选一个 provider 并填上 key 即可，无需改其他代码。
  //
  // 申请入口（免费额度）：
  //   聚合数据老黄历: https://www.juhe.cn/docs/api/id/606
  //   天行数据黄历  : https://www.tianapi.com/apiview/111
  //   极速数据黄历  : https://www.jisuapi.com/api/huangli/
  //
  // 想先看效果、暂时没 key：把 provider 设为 'demo'，会用一份示例数据填充（仅演示，非真实当日宜忌）。
  var API_CONFIG = {
    provider: 'tianapi', // 'demo' | 'juhe' | 'tianapi' | 'jisu'
    key: '6d05ac912c21f8ad4d02157947924486' // 天行数据 APIKEY
  };

  var providers = {
    // 聚合数据：https://apis.juhe.cn/fapig/calendar/day
    juhe: function (date) {
      return {
        url: 'https://apis.juhe.cn/fapig/calendar/day?date=' + fmt(date) + '&key=' + API_CONFIG.key,
        parse: function (j) {
          if (!j || j.error_code !== 0 || !j.result || !j.result.data) return null;
          var d = j.result.data;
          return { yi: d.suit, ji: d.avoid, chong: d.dayCS || d.cs, wuxing: d.wuxing || d.zhiRi };
        }
      };
    },
    // 天行数据：https://apis.tianapi.com/lunar/index （已按真实返回字段校准）
    //   宜=fitness 忌=taboo 冲煞=chongsha 五行=wuxingnayear 神位=shenwei
    tianapi: function (date) {
      return {
        url: 'https://apis.tianapi.com/lunar/index?key=' + API_CONFIG.key + '&date=' + fmt(date),
        parse: function (j) {
          if (!j || j.code !== 200 || !j.result) return null;
          var d = j.result;
          // 五行：优先纳音年（如“天河水”），退回甲子五行（如“水”）
          var wx = d.wuxingnayear || d.wuxingjiazi || d.wuxingnamonth || '';
          if (wx && d.jianshen) wx += ' · ' + d.jianshen; // 拼上建除十二神（值日）
          return {
            yi: d.fitness,
            ji: d.taboo,
            chong: d.chongsha,
            wuxing: wx,
            shenwei: d.shenwei,     // 喜神/财神/福神方位
            pengzu: d.pengzu,       // 彭祖百忌
            festival: d.lunar_festival || d.festival
          };
        }
      };
    },
    // 极速数据：https://api.jisuapi.com/huangli/date
    jisu: function (date) {
      return {
        url: 'https://api.jisuapi.com/huangli/date?appkey=' + API_CONFIG.key +
             '&year=' + date.getFullYear() + '&month=' + (date.getMonth() + 1) + '&day=' + date.getDate(),
        parse: function (j) {
          if (!j || j.status !== 0 || !j.result) return null;
          var d = j.result;
          return { yi: d.yi, ji: d.ji, chong: d.chongsha, wuxing: d.wuxing };
        }
      };
    }
  };

  // demo 示例数据：随日期变化给出一组固定的宜忌，仅用于展示界面，不代表真实黄历
  var DEMO_YI = ['祭祀 祈福 出行 纳财 开市', '嫁娶 动土 安床 交易', '沐浴 扫舍 修饰垣墙', '会亲友 立券 纳畜', '解除 求医 破屋 坏垣'];
  var DEMO_JI = ['安葬 破土 开渠', '入宅 探病 掘井', '嫁娶 出行 移徙', '祈福 上梁 竖柱', '诸事不宜'];
  var DEMO_CHONG = ['冲鼠(壬子)煞北', '冲牛(癸丑)煞西', '冲虎(甲寅)煞南', '冲兔(乙卯)煞东'];
  var DEMO_WX = ['金 · 除', '木 · 满', '水 · 平', '火 · 定', '土 · 执'];

  function buildRequest(date) {
    if (API_CONFIG.provider === 'demo') return null; // demo 在 fetchHuangli 里单独处理
    var f = providers[API_CONFIG.provider];
    if (!f || !API_CONFIG.key) return null;
    return f(date);
  }

  function fmt(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  function $(id) { return document.getElementById(id); }

  function renderLocal(date) {
    var l = Lunar.solar2lunar(date);

    $('solarYmd').textContent = date.getFullYear() + ' 年 ' + (date.getMonth() + 1) + ' 月 ' + date.getDate() + ' 日';
    $('solarWeek').textContent = weekCn[date.getDay()];
    $('weekCn').textContent = weekCn[date.getDay()];

    $('bigDay').textContent = l.dayCn;
    $('lunarMain').textContent = '农历 ' + l.gzYear + '年 ' + l.monthCn + l.dayCn;
    $('ganzhi').textContent = l.gzYear + '年 · ' + l.gzDay + '日 · 属' + l.animal;
    $('animal').textContent = l.animal;

    var termWrap = $('termWrap');
    termWrap.innerHTML = l.term ? '<span class="term-badge">' + l.term + '</span>' : '';

    return l;
  }

  function setYiJiLoading() {
    $('yiText').textContent = '加载中…';
    $('jiText').textContent = '加载中…';
    $('chong').textContent = '—';
    $('wuxing').textContent = '—';
    $('yiText').parentElement.parentElement.classList.add('loading');
    $('status').textContent = '';
    $('status').classList.remove('err');
  }

  function fillYiJi(data) {
    $('yiText').textContent = data.yi || '诸事不宜';
    $('jiText').textContent = data.ji || '无';
    $('chong').textContent = data.chong || '—';
    $('wuxing').textContent = data.wuxing || '—';
    $('yiText').parentElement.parentElement.classList.remove('loading');
  }

  function fillDemo(date) {
    // 用当日干支日的序号做索引，保证同一天结果稳定
    var idx = Math.abs(Math.floor(date.getTime() / 86400000));
    fillYiJi({
      yi: DEMO_YI[idx % DEMO_YI.length],
      ji: DEMO_JI[idx % DEMO_JI.length],
      chong: DEMO_CHONG[idx % DEMO_CHONG.length],
      wuxing: DEMO_WX[idx % DEMO_WX.length]
    });
    $('status').classList.remove('err');
    $('status').innerHTML =
      '当前为 <b>演示数据</b>，非真实当日宜忌。<br>' +
      '申请免费接口 key 后，在 app.js 顶部 API_CONFIG 里填入即可联网显示真实黄历。';
  }

  function fetchHuangli(date) {
    setYiJiLoading();

    if (API_CONFIG.provider === 'demo') {
      fillDemo(date);
      return;
    }

    var req = buildRequest(date);
    if (!req) {
      $('yiText').parentElement.parentElement.classList.remove('loading');
      $('status').classList.add('err');
      $('status').innerHTML =
        '接口未正确配置：请在 app.js 顶部 API_CONFIG 中设置 provider 和 key。';
      return;
    }
    fetch(req.url, { method: 'GET' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        var data = req.parse(json);
        if (!data) throw new Error('解析失败');
        fillYiJi(data);
      })
      .catch(function (e) {
        $('yiText').parentElement.parentElement.classList.remove('loading');
        $('status').classList.add('err');
        $('status').textContent = '宜忌加载失败：' + e.message + '（请检查网络或接口配置）';
      });
  }

  function render() {
    renderLocal(current);
    fetchHuangli(current);
  }

  function shift(days) {
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + days);
    render();
  }

  document.getElementById('prevDay').addEventListener('click', function () { shift(-1); });
  document.getElementById('nextDay').addEventListener('click', function () { shift(1); });
  document.getElementById('todayBtn').addEventListener('click', function () {
    current = new Date();
    render();
  });

  // 左右滑动切换日期
  var startX = null;
  document.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 60) shift(dx < 0 ? 1 : -1);
    startX = null;
  }, { passive: true });

  render();
})();
