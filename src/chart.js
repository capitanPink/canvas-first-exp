function Chart(opt) {
  const _this = this;
  const RAF = window.requestAnimationFrame;

  const THEME = opt.theme || 'light';
  const PERIOD = opt.period || 1000 * 60 * 60 * 24;
  const POINTS = opt.points || 6;
  const COLORS = {
    AXIS: '#ecf0f3',
    BOX_BRDR: '#ddeaf3',
    BOX: '#f5f9fb',
    WHITE: '#ffffff',
    FONT: '#999c9e',
    BLACK: '#000000'
  };
  const FF = opt.fontFamaly || 'Roboto';
  const font = `${opt.fontSize || 9}pt ${FF}`;
  const fontlbl = `${opt.fontLblSize || 10}pt ${FF}`;
  const fontHdr = `${opt.fontHdrSize || 10}pt ${FF}`;
  const el = opt.elem;
  
  const { c, w, h } = setUpCnvs(document.createElement('canvas'), opt.width, opt.height);
  const ctx = c.getContext('2d');
  const btns = [];
  // ctx.fillStyle = "red";
  // c.globalAlpha = 0.4;
  // ctx.fillRect(0,0,w,h);
  // c.globalAlpha = 1;
  // c.style.opacity = '0.2'
  // ctx.fill();

  const chartProps = {
    x: 0,
    y: h * 0.1,
    w: w,
    h: h * 0.5,
    lw: 2,
    clw: 1
  };

  const minChartProps = {
    x: 0,
    y: h * 0.65,
    w: w,
    h: h * 0.06,
    boxW: w * 0.25,
    boxH: h * 0.0565,
    xBox: w * 0.9925 - w * 0.25,
    yBox: h * 0.652,
    lw: 1
  };

  let xl, yl;

  const actvz = {
    s: null,
    e: null,
    length: null
  };

  function build(data) {
    console.log(data);
    const nmsClrs = Object.keys(data.names).map((e) => [e, data.names[e], data.colors[e]]);
    // console.log('nmsClrs', nmsClrs);

    drawChart(data, minChartProps, nmsClrs);
    bindEvents(c, minChartProps, chartProps, COLORS);

    el.appendChild(c);
  }

  function drawChart(data, p, nmsClrs) {
    _this.data = data;
    const chartCols = _this.data.columns;
    const mergedCols = mergeCols(chartCols);
    xl = findMaxMin(mergedCols.x, actvz, true);
    yl  = findMaxMin(mergedCols.y, actvz);

    drawMinChart(_this.data, ctx, minChartProps, xl, yl, COLORS);
    drawButtons(ctx, p.w * 0.02, p.y + p.h + h * 0.03, nmsClrs);
  }

  function drawMinChart(data, c, p, xl, yl, clrs, d = {}, m) {
    RAF(() => {
      clearChart(c, 0, p.y, p.w, p.h);
      drawMovingSquire(c, p, clrs, d, m);
      drawMiniature(data, c, w, h, p, xl, yl, PERIOD);
      drawMinChartCoordinates(c, p, COLORS.AXIS, xl, PERIOD);
    });
  }

  function bindEvents(c, p, pMain, clrs) {
    const self = this;
    this.clxs = p.xBox;
    this.clxe = p.xBox + p.boxW;
    this.isDL = false;
    this.isDR = false;
    this.isMvd = false;
    this.diffs = { xl: null, xr: null };
    this.isExp = false;
    this.isB2sm = false;
    this.isInMain = false;

    c.addEventListener('touchstart', handleTouchStart, false);
    c.addEventListener('touchend', handleTouchEnd, false);
    c.addEventListener('touchmove', throttle(handleTouchMove, 15), false);

    // To add
    // c.addEventListener('mouseover', handleTouchStart, false);
    // c.addEventListener('mouseout', handleTouchEnd, false);
    // c.addEventListener('mousemove', throttle(handleTouchMove, 15), false);

    function handleBtnsOnTouch(c, x, y) {
      btns.forEach(e => {
        if (x > e[3] && x < e[3] + e[4] && y > e[6] && y < e[6] + e[5]) {
          toggleBtnState(c, e[7], e[8], e[5], [e[0], e[1], e[2]], !e[9]);
          e[9] = !e[9];
        }
      });
    }

    function handleTouchEnd(event) {
      const { clientX } = event.changedTouches[0];
  
      if (self.isDL) {
        if (self.isB2sm) self.clxs = p.xBox;
        else self.clxs = clientX;
      } else if (self.isDR) {
        if (!self.isB2sm) self.clxe = clientX;
        else self.clxe = p.xBox + p.boxW;
      }
    }
  
    function handleTouchStart(event) {
      self.prev = undefined;
      const { clientX, clientY } = event.touches[0];

      handleBtnsOnTouch(ctx, clientX, clientY);

      isInMin = clientY > p.y && clientY < p.y + p.h;
      self.isDL = inClxs(clientX, getClxslim()) && isInMin;
      self.isDR = inClxe(clientX, getClxelim()) && isInMin;
      self.Mvd = clientX > self.clxs && clientX < self.clxs + p.boxW && isInMin;

      if (self.Mvd) {
        self.diffs.xl = clientX - self.clxs;
        self.diffs.xr = self.clxe - clientX;
      } else if (isInM(clientX, clientY, pMain)) {
        drawMainChart(_this.data, ctx, chartProps, actvz, PERIOD, COLORS, { clientX, clientY });
      }
    }
  
    function handleTouchMove(event) {
      const { clientX } = event.touches[0];
      self.isMvr = self.isDR && self.prev < clientX && clientX > p.xBox + p.boxW - 5;
      self.isMvl = self.isDL && self.prev > clientX && clientX < p.xBox + 5;
      self.prev = clientX;
      self.isB2sm = p.boxW < p.w * 0.15;

      const maxBoxW = p.w - 5;
      const minBoxW = p.x + 5;
      const isDrggbl = (self.isDL || self.isDR)
        && clientX < maxBoxW
        && clientX > minBoxW;
      const isMvbl = self.Mvd
        && clientX > self.diffs.xl + 2
        && clientX + self.diffs.xr < w - 2;

      if (isDrggbl) {
        
        if (self.isMvr) {
          if (!self.isMvr && self.isB2sm) {
            
            } else {
              const d = { xl: self.isDL && clientX, xr: self.isDR && clientX };
              drawMinChart(_this.data, ctx, p, xl, yl, clrs, d);
            }
        } else if (self.isMvl) {
          if (!self.isMvl && self.isB2sm) {
            
            } else {
              const d = { xl: self.isDL && clientX, xr: self.isDR && clientX };
              drawMinChart(_this.data, ctx, p, xl, yl, clrs, d);
            }
        } else if (!self.isB2sm) {
          const d = { xl: self.isDL && clientX, xr: self.isDR && clientX };
          drawMinChart(_this.data, ctx, p, xl, yl, clrs, d);
        }
        
        
      } else if (isMvbl) {
        self.clxs = clientX - self.diffs.xl;
        self.clxe = clientX + self.diffs.xr;
        drawMinChart(_this.data, ctx, p, xl, yl, clrs, {}, self.clxs);
      }
    }

    function isInM(x, y, p) {
      return x >= p.x && x <= p.w && y >= p.y * 0.8 && y <= p.h + p.y;
    }

    function getClxslim() {
      return { d: this.clxs - 7, t: this.clxs + 15 };
    }

    function getClxelim() {
      return { d: this.clxe - 15, t: this.clxe + 10 };
    }

    function inClxs(clx, clxslim) {
      return clx > clxslim.d && clx < clxslim.t;
    }

    function inClxe(clx, clxelim) {
      return clx > clxelim.d && clx < clxelim.t;
    }
  }

  function findIndexes(w, actvz) {
    const i = w / actvz.length;
    return {
      s: Math.round(actvz.s / i),
      e: Math.round(actvz.e / i)
    };
  }

  function getArrayCut(cols, indxs) {
    return cols.map((a) => [a[0]].concat(a.slice(indxs.s, indxs.e + 1)));
  }

  function drawMovingSquire(c, p, clrs, d, mX) {
    const temp = d.xl && p.xBox - d.xl;
    p.xBox = mX || d.xl || p.xBox;
    p.boxW = d.xr ? d.xr - p.xBox : d.xl ? p.boxW + temp : p.boxW;

    actvz.s = p.xBox;
    actvz.e = p.xBox + p.boxW;

    const bw = p.boxW;
    const bh = p.boxH;
    const x = p.xBox;
    const y = p.yBox;

    drawRect(c, p.x, p.y, p.w, p.h, clrs.BOX);
    drawRect(c, x - 5, y - 1, bw + 10, bh + 2, clrs.BOX_BRDR);
    drawRect(c, x, y, bw, bh, clrs.WHITE);
    
    drawMainChart(_this.data, ctx, chartProps, actvz, PERIOD, COLORS);
  }

  function drawRect(c, x, y, w, h, clr) {
    c.beginPath();
    c.fillStyle = clr;
    c.fillRect(x, y, w, h);
  }

  function drawMainChart(data, c, p, actvz, per, COLORS, val) {
    const clrs = Object.values(data.colors);
    const yc = p.y + p.h + (p.y + p.h) * 0.06
    
    const indxs = findIndexes(p.w, actvz);
    const aCut = getArrayCut(data.columns, indxs);
    const mCls = mergeCols(aCut);
    const xlc = findMaxMin(mCls.x, actvz);
    const ylc  = findMaxMin(mCls.y, actvz);

    let fFlag = true;
    const vals = {};

    const { stX } = getSteps(p.w, p.h * 0.8, xlc, ylc, per);
    
    clearChart(c, p.x, 0, p.w, yc);
    drawChartCoordinates(ctx, p, COLORS.AXIS, xlc, ylc);

    for(let i = aCut.length - 1; i > 0; i--) {
      const clr = clrs[i - 1];
      fFlag = true;
      vals[aCut[i][0]] = {};

      c.beginPath();
      for (let j = 1, x = p.x; j < aCut[i].length; j++, x += stX) {
        const y = p.h + p.y - p.h * aCut[i][j] / ylc.max;

        if (val && x > val.clientX && fFlag) {
          vals[aCut[i][0]].x = x;
          vals[aCut[i][0]].yv = aCut[i][j];
          vals[aCut[i][0]].y = y;
          vals[aCut[i][0]].clr = clr;
          fFlag = false;
        }
        
        if (j === 1) {
          c.moveTo(x, y);
        } else {
          c.lineTo(x, y);
        } 
      }

      c.strokeStyle = clr;
      c.lineWidth = p.lw;
      c.stroke();
    }
    if (val) {
      drawVal(c, p, vals, COLORS, xlc);
    }
  }

  function drawVal(c, p, vals, clrs, xlc) {
    // console.log('vals', vals);
    const valsVls = Object.values(vals);
    
    const valsNms = Object.keys(vals);
    // console.log('vals', valsVls, valsNms);

    const { names } = _this.data;
    const curx = valsVls[0].x;
    const t = formatDate(new Date((xlc.max - xlc.min) / p.w * curx + xlc.min),
          { weekday: 'short', month: 'short', day: '2-digit' });
    const tw = mesT(c, t) * 1.5;
    const lch = parseInt(fontlbl) * 2 + 14;
    const lsA = [];
    let cmnw = 0;

    valsVls.forEach((e, i)=> {
      if (!i) {
        c.beginPath();
        c.moveTo(e.x, p.y)
        c.lineTo(e.x, p.y + p.h);
        c.strokeStyle = clrs.AXIS;
        c.lineWidth = p.clw;
        c.stroke();
      }
      
      drawArc(c, e.x, e.y, 5, 0, 2 * Math.PI, e.clr, clrs.WHITE, 2);

      const mls = getMxLLn(c, names[valsNms[i]], e.yv) + 10;
      lsA.push(getLSz(names[valsNms[i]], mls, lch, e.yv, e.clr));
      cmnw += mls;
    });

    const bw = cmnw > tw ? cmnw : tw;
    const hfh = parseInt(fontHdr);
    const lh = hfh + parseInt(lsA.reduce((a, n) => a < n[2] ? n[2] : a, 0)) + 20;
    const { x, y } = findBoxCoord(curx, p, bw, lh);

    roundRect(c, x, y, bw, lh, 3, COLORS.AXIS, COLORS.WHITE);
    drawTxt(c, t, x + bw/2, y + hfh * 0.5, 'center', 'top', COLORS.BLACK);

    lsA.reverse().forEach((e, i) => {
      const wPerE = bw / lsA.length;
      const xt = x + wPerE * (i + 1) - wPerE / 2;
      const yt = y + hfh;
      drawTxt(c, e[3], xt, yt + e[2] * 0.5, 'center', 'top', e[4]);
      drawTxt(c, e[0], xt, yt + e[2], 'center', 'top', e[4]);
    });
    
  }

  function drawArc(c, x, y, r, sA, eA, strSt, flSt, lw, dr) {
    c.save();
    c.beginPath();
    c.arc(x, y, r, sA, eA, dr);
    c.strokeStyle = strSt;
    c.fillStyle = flSt;
    c.lineWidth = lw;
    c.fill();
    c.stroke();
    c.restore();
  }

  function drawButtons(c, x, y, nmsClrs) {
    this.pw;
    const btnH = parseInt(fontHdr) * 3.5;

    clearChart(c, 0, y - 3, w, btnH + btnH * 0.3);
    nmsClrs.forEach((e, i) => drawButton(c, x, y, btnH, e, i, this.px));
    console.log('btns', btns);
  }

  function drawButton(c, x, y, btnH, e, i) {
    const txtW = mesT(c, e[1]);
    const bw = w * 0.2 > 30 + txtW ? w * 0.2 : 30 + txtW;
    const bx = x + (bw + (i ? 10 : 0)) * i;
    const xa = bx + btnH * 0.5;
    const ya = y + btnH * 0.5;

    btns[i] = [...e, bx, bw, btnH, y, xa, ya, true];

    roundRect(c, bx, y, bw , btnH, btnH * 0.5, COLORS.AXIS, COLORS.WHITE);
    drawTxt(c, e[1], bx + bw * 0.6, ya + btnH * 0.05, 'center', 'middle', fontHdr);
    toggleBtnState(c, xa, ya, btnH, e, true);
  }

  function toggleBtnState(c, xa, ya, btnH, e, actv) {
    drawArc(c, xa, ya, btnH * 0.3 , 0, 2 * Math.PI, COLORS.WHITE, e[2]);
    if (actv) {
      drawTick(c, xa - 6, ya, 2, COLORS.WHITE);
    } else {
      drawArc(c, xa, ya, btnH * 0.23 , 0, 2 * Math.PI, COLORS.WHITE, COLORS.WHITE);
    }
  }

  function drawTick(c, x, y, lw, clr) {
    c.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4,y + 4);
    ctx.lineTo(x + 11, y - 4);
    ctx.lineWidth = lw;
    ctx.strokeStyle = clr;
    ctx.stroke();
    c.restore();
  }

  function drawTxt(c, t, x, y, al, tb, clr, font) {
    c.save();
    c.beginPath();
    c.moveTo(x, y + y * 0.2);
    c.fillStyle = clr;
    c.font = font || fontHdr;
    c.textAlign = al; 
    c.textBaseline = tb; 
    c.fillText(t, x, y);
    c.restore();
  }

  function getMxLLn(c, n, y) {
    // console.log('maxL', n, y);
    return Math.max(...[mesT(c, n), mesT(c, y)]);
  }

  function getLSz(n, w, h, y, clr) {
    return [n, w, h, y, clr];
  }

  function mesT(c, v) {
    // console.log(arguments);
    return c.measureText(v).width;
  }

  function findBoxCoord(x, p, w, h) {
    // to fix
    // console.log('boxw', w);
    const xr = x - 0.25 * w;
    const xl = x - 0.75 * w;
    const mxx = p.w * 0.96;
    const mnx = p.w * 0.04;
    // console.log({
    //   x: x + w > p.w && x < mxx? xl : x > mxx ? x - w : x < mnx ? x : xr,
    //   y: p.y
    // })
    return {
      x: x + w > p.w && x < mxx? xl : x > mxx ? x - w : x < mnx ? x : xr,
      y: p.y
    };
  }

  function roundRect(c, x, y, w, h, r, strSt, flSt) {
    console.log('args', arguments);
    c.save();
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.strokeStyle = strSt;
    c.closePath();
    c.stroke();
    // c.translate(300,300);
    // c.shadowColor = '#D5D5D5';
    // c.shadowBlur = 15;
    // c.globalAlpha = 0.8
    // c.shadowOffsetY = 1;
    c.fillStyle = flSt;
    c.fill()
    c.restore();
  }

  function drawMiniature(chart, c, w, h, p, xl, yl, per) {
    const { stX, stY } = getSteps(w, p.h * 0.85, xl, yl, per);
    const colors = Object.values(chart.colors);
    const cols = chart.columns;

    for (let i = cols.length - 1; i > 0; i--) {
      c.beginPath();
      for (let j = 1, x = p.x; j < cols[i].length; j++, x += stX) {
        const y = (p.y + p.h) - cols[i][j] * stY;
        if (j === 1) {
          c.moveTo(x, y);
        } else {
          c.lineTo(x, y);
        } 
      }
      c.strokeStyle = colors[i - 1];
      c.lineWidth = p.lw;
      c.stroke();
    }
  }

  function drawChartCoordinates(c, p, clr, xlc, ylc) {
    const y = p.y + p.h;
    c.beginPath();
    c.moveTo(p.x, y);
    c.lineTo(p.w, y);
    c.strokeStyle = clr;
    c.lineWidth = p.clw;
    c.stroke();
    c.closePath();

    dXC(c, p, xlc, getPeriodUTC(xlc));
    dYC(c, p, getYCPer(p, ylc));
  }

  function drawMinChartCoordinates(c, p, clr) {
    const y = p.y + p.h;
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(p.x, y);
    c.lineTo(p.w, y);
    c.strokeStyle = clr;
    c.lineWidth = p.lw;
    c.stroke();
  }

  function getPeriodUTC(xlc) {
    return new Date(xlc.max) - new Date(xlc.min);
  }

  function getYCPer(p, ylc) {
    return (ylc.max - ylc.min) / p.h;
  }

  function dXC(c, p, xlc, t) {
    const st = p.w / POINTS;
    const stdiff = t / p.w;
    const xshft = p.w * 0.06;
    const tshft = stdiff * xshft;
    const yshft = (p.y + p.h) * 0.05

    c.beginPath()
    c.fillStyle = COLORS.FONT;
    c.font = font;

    for (let i = 0, x = p.x; i < POINTS; i++, x += st){
      const y = p.y + p.h;
      const xx = x + xshft;
      const txt = formatDate(getDate(xlc, t, tshft, i), { month: 'short', day: '2-digit' });
      c.moveTo(xx, y);
      c.fillText(txt, xx - xshft / 2, y + yshft);
    }
    c.lineWidth = p.clw;
    c.stroke();
  }

  function dYC(c, p, t) {
    const st = t * p.h / POINTS;
    const sty = p.h / POINTS;

    c.beginPath()
    c.fillStyle = COLORS.FONT;
    c.font = `12px ${FF}`;
    
    for (let i = 0, y = p.y + p.h; i < POINTS; i++, y -= sty) {
      c.moveTo(p.x, y);
      c.lineTo(p.w, y);
      c.fillText(i === 0 ? '0' : round(st * i), p.x, y - 5);
    }
    c.lineWidth = p.clw;
    c.stroke();
  }

  function getDate(xlc, diff, tshft, pnts) {
    return new Date((xlc.min + diff / POINTS * pnts) + tshft);
  }

  function formatDate(d, f) {
    return d.toLocaleString('en-us', f);
  }

  function setUpCnvs(c, w, h) {
    const dw = document.body.scrollWidth;
    const dh = document.body.scrollHeight;
    c.style.margin = 'auto';
    c.style.display = 'block';
    c.width = w || dw * 0.98;
    c.height = h || dh * 0.98;
    return { c, w: c.width, h: c.height };
  }

  function clearChart(c, x, y, w, h) {
    console.log('clearing', arguments);
    c.clearRect(x, y, w, h);
  }

  function round(dgt) {
    const l = ('' + dgt).length;
    if (l === 1) {
      return dgt;
    } else if (l === 2) {
      return Math.round(dgt / 10) * 10; 
    } else if (l === 3) {
      return Math.round(dgt / 100) * 100; 
    } else {
      return Math.round(dgt / 1000) * 1000;
    }
  }

  function findMaxMin(array, actvz, isM) {
    if (isM && array[0].startsWith('x')) {
      actvz.length = array.length;
    }
    let max = -Infinity, min = Infinity;
    for (let i = array.length; i--;) {
      const el = array[i];
      if (typeof elem !== 'string') {
        if (min > el) min = el;
        if (max < el) max = el;
      }
    }
    return { min, max };
  }

  function mergeCols(columns) {
    return columns.reduce((acc, next) => 
      (next[0].startsWith('x') && Object.assign({}, acc, { x: [...(acc.x ? acc.x : []), ...next] })) ||
      (next[0].startsWith('y') && Object.assign({}, acc, { y: [...(acc.y ? acc.y : []), ...next] }))
    , {});
  }

  function getSteps(w, h, xl, yl, period) {
    return {
      stX: w / ((xl.max - xl.min) / period),
      stY: h / (yl.max - yl.min)
    };
  }

  function throttle(f, l) {
    let s;
    return function() {
      if (!s) {
        f.apply(this, arguments)
        s = true
        setTimeout(() => s = false, l)
      }
    }
  }

  return { build };
}