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
    FONT: '#999c9e'
  };
  const FF = opt.fontFamaly || 'Roboto';
  const el = opt.elem;
  
  const { c, w, h } = setUpCnvs(document.createElement('canvas'), opt.width, opt.height);
  const ctx = c.getContext("2d");

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
    h: h * 0.065,
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
    
    drawChart(data);
    bindEvents(c, minChartProps, chartProps, COLORS);

    el.appendChild(c);
  }

  function drawChart(data) {
    _this.data = data;
    const chartCols = _this.data.columns;
    const mergedCols = mergeCols(chartCols);
    xl = findMaxMin(mergedCols.x, actvz, true);
    yl  = findMaxMin(mergedCols.y, actvz);

    drawMinChart(_this.data, ctx, minChartProps, xl, yl, COLORS);
  }

  function drawMinChart(data, c, p, xl, yl, clrs, d = {}, m) {
    RAF(() => {
      clearChart(c, 0, p.y, p.w, p.y + p.h);
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
      
      isInMin = clientY > p.y && clientY < p.y + p.h;
      self.isDL = inClxs(clientX, getClxslim()) && isInMin;
      self.isDR = inClxe(clientX, getClxelim()) && isInMin;
      self.Mvd = clientX > self.clxs && clientX < self.clxs + p.boxW && isInMin;
  
      if (self.Mvd) {
        self.diffs.xl = clientX - self.clxs;
        self.diffs.xr = self.clxe - clientX;
      } else if (isInM(clientX, clientY, pMain)) {
        console.log('here', clientX, clientY);
        console.log('activz', actvz);
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
    console.log('vals', vals);
    if (val) {
      const nms = Object.keys(vals);
      Object.values(vals).forEach((e, i) => drawVal(c, p, e, COLORS, i, nms, xlc));
    }
  }



  function drawVal(c, p, vals, clrs, i, nms, xlc) {
    if (!i) {
      c.beginPath();
      c.moveTo(vals.x, p.y)
      c.lineTo(vals.x, p.y + p.h);
      c.strokeStyle = clrs.AXIS;
      c.lineWidth = p.clw;
      c.stroke();
    }

    c.beginPath();
    c.arc(vals.x, vals.y, 5, 0, 2 * Math.PI);
    c.strokeStyle = vals.clr;
    c.fillStyle = clrs.WHITE;;
    c.lineWidth = p.lw;
    c.fill();
    c.stroke();

    const { x, y } = findBoxCoord(vals.x, p, 62, 47);
    console.log('(xlc.max - xlc.min) / p.w * x + xlc.min', x);
    const t = formatDate(new Date((xlc.max - xlc.min) / p.w * vals.x + xlc.min));
    console.log(t);
    roundRect(c, x, y, 62, 47, 3, COLORS);
    getLabelsLngth(c, nms[i], vals.x, vals.yv);
  }

  function findBoxCoord(x, p, w, h) {
    const xr = x - 0.25 * w;
    const xl = x - 0.75 * w;
    const mxx = p.w * 0.96;
    const mnx = p.w * 0.04;
    return {
      x: x + w > p.w && x < mxx? xl : x > mxx ? x - w : x < mnx ? x : xr,
      y: p.y
    };
  }

  function getLabelsLngth(c, n, x, y) {
    console.log(c.measureText(n).width);
    console.log(c.measureText(x + '').width);
    console.log(c.measureText(y + '').width);
  }

  function roundRect(c, x, y, w, h, r, clr) {
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
    c.strokeStyle = clr.AXIS;
    c.closePath();
    c.stroke();
    c.fillStyle = clr.WHITE;
    c.fill()
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
    dYC(c, p, ylc, getYCPer(p, ylc));
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
    c.font = `12px ${FF}`;

    for (let i = 0, x = p.x; i < POINTS; i++, x += st){
      const y = p.y + p.h;
      const xx = x + xshft;
      const txt = formatDate(getDate(xlc, t, tshft, i));
      c.moveTo(xx, y);
      c.fillText(txt, xx - xshft / 2, y + yshft);
    }
    c.lineWidth = p.clw;
    c.stroke();
  }

  function dYC(c, p, ylc, t) {
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

  function formatDate(d) {
    return d.toLocaleString('en-us', { month: 'short', day: '2-digit' });
  }

  function setUpCnvs(c, w, h) {
    c.style.margin = 'auto';
    c.style.display = 'block';
    c.width = w || document.body.scrollWidth * 0.98;
    c.height = h || document.body.scrollHeight * 0.98;
    return { c, w: c.width, h: c.height };
  }

  function clearChart(c, x, y, w, h) {
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