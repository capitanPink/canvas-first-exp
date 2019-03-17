function Chart(opt) {
  const _this = this;

  const THEME = opt.theme || 'light';
  const PERIOD = opt.period || 1000 * 60 * 60 * 24;
  const POINTS = opt.points || 6;
  const COLORS = {
    AXIS: '#ecf0f3',
    BOX_BRDR: '#ddeaf3',
    BOX: '#f5f9fb',
    WHITE: '#ffffff',
    FONT: '#a5b0b7'
  };
  const FF = opt.fontFamaly || 'Roboto-thin';
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
    bindEvents(c, minChartProps, COLORS);

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
    clearChart(c, 0, p.y, p.w, p.y + p.h);
    drawMovingSquire(c, p, clrs, d, m);
    drawMiniature(data, c, w, h, p, xl, yl, PERIOD);
    drawMinChartCoordinates(c, p, COLORS.AXIS, xl, PERIOD);
  }

  function bindEvents(c, p, clrs) {
    const self = this;
    this.clxs = p.xBox;
    this.clxe = p.xBox + p.boxW;
    this.isDL = false;
    this.isDR = false;
    this.isMvd = false;
    this.diffs = { xl: null, xr: null };
    this.isExp = false;
    this.isB2sm = false;

    c.addEventListener('touchstart', handleTouchStart, false);
    c.addEventListener('touchend', handleTouchEnd, false);
    c.addEventListener('touchmove', throttle(handleTouchMove, 5), false);

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

  function drawMainChart(data, c, p, actvz, per, COLORS) {
    const colors = Object.values(data.colors);
    const ymin = p.h * 0.95;
    const yc = p.y + p.h + (p.y + p.h) * 0.06
    
    const indxs = findIndexes(p.w, actvz);
    const aCut = getArrayCut(data.columns, indxs);
    const mergedCols = mergeCols(aCut);
    const xlc = findMaxMin(mergedCols.x, actvz);
    const ylc  = findMaxMin(mergedCols.y, actvz);
    const { stX } = getSteps(p.w, p.h * 0.8, xlc, ylc, per);

    clearChart(c, p.x, 0, p.w, yc);
    drawChartCoordinates(ctx, p, COLORS.AXIS, xlc, ylc);

    for(let i = aCut.length - 1; i > 0; i--) {
      c.beginPath();
      for (let j = 1, x = p.x; j < aCut[i].length; j++, x += stX) {
        const y = p.y + ymin  * ylc.min / aCut[i][j];
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
      const txt = getDate(xlc, t, tshft, i)
        .toLocaleString('en-us', { month: 'short', day: '2-digit' });
      c.moveTo(xx, y);
      c.fillText(txt, xx - xshft / 2, y + yshft);
    }
    c.lineWidth = p.clw;
    c.stroke();
  }

  function dYC(c, p, ylc, t) {
    const ys = ylc.min - t * p.h * 0.05;
    const st = t * p.h / POINTS;
    const sty = p.h / POINTS;
    console.log(t, ys, st);

    c.beginPath()
    for (let i = 0, y = p.y + p.h; i < POINTS; i++, y -= sty) {
      console.log('here', sty, y);
      c.moveTo(p.x, y);
      c.lineTo(p.w, y);
    }
    c.lineWidth = p.clw;
    c.stroke();
  }

  function getDate(xlc, diff, tshft, pnts) {
    return new Date((xlc.min + diff / POINTS * pnts) + tshft);
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