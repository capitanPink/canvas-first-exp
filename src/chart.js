function Chart(opt) {
  const _this = this;
  const THEME = opt.theme || 'light';
  const UTC_DAY = 1000 * 60 * 60 * 24;

  const COLORS = {
    AXIS: '#ecf0f3',
    BOX_BRDR: '#ddeaf3',
    BOX: '#f5f9fb',
    WHITE: '#ffffff'
  };
  const el = opt.elem;
  
  const { c, w, h } = setUpCnvs(document.createElement('canvas'), opt.width, opt.height);
  const ctx = c.getContext("2d");

  const chartProps = {
    x: 0,
    y: h * 0.6,
    w: w
  };

  const minChartProps = {
    x: 0,
    y: h * 0.65,
    w: w,
    h: h * 0.06,
    boxW: w * 0.25,
    boxH: h * 0.0565,
    xBox: w * 0.9925 - w * 0.25,
    yBox: h * 0.652
  };

  let xl, yl, indxs;

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
    xl = findMaxMin(mergedCols.x, actvz);
    yl  = findMaxMin(mergedCols.y, actvz);

    drawMinChart(_this.data, ctx, minChartProps, xl, yl, COLORS);
    drawChartCoordinates(ctx, chartProps, COLORS.AXIS, 1);
  }

  function drawMinChart(data, c, p, xl, yl, clrs, d = {}, m) {
    clearChart(c, 0, p.y, p.w, p.y + p.h);
    drawMovingSquire(c, p, clrs, d, m);
    drawMiniature(data, c, w, h, p, xl, yl, UTC_DAY, 1);
    drawMinChartCoordinates(c, p, clrs.AXIS, 1);
  }

  function clearChart(c, x, y, w, h) {
    c.clearRect(x, y, w, h);
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
    console.log(cols, actvz);
    return cols.map((a) => a.slice(indxs.s, indxs.e + 1));
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

    drawMainChart(p.w, actvz);
  }

  function drawRect(c, x, y, w, h, clr) {
    c.beginPath();
    c.fillStyle = clr;
    c.fillRect(x, y, w, h);
  }

  function drawMainChart(w, actvz) {
    indxs = findIndexes(p.w, actvz);

    console.log('active zone', indxs);
    // console.log('length', actvz.length);
    console.log(getArrayCut(_this.data.columns, indxs));
  }

  function drawMiniature(chart, c, w, h, p, xl, yl, per, lw) {
    const { stX, stY } = getSteps(w, p.h * 0.85, xl, yl, per);
    const colors = Object.values(chart.colors);
    const cols = chart.columns;

    for (let i = cols.length - 1; i > 0; i--) {
      c.beginPath();
      for (let j = 1, x = p.x; j < cols[i].length; j++, x += stX) {
        const y = h * 0.71 - cols[i][j] * stY;
        if (j === 1) {
          c.moveTo(x, y);
        } else {
          c.lineTo(x, y);
        }
        c.strokeStyle = colors[i - 1];
      }
      c.lineWidth = lw;
      c.stroke();
    }
  }

  function drawChartCoordinates(c, p, clr, lw) {
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(p.w, p.y);
    c.strokeStyle = clr;
    c.lineWidth = lw;
    c.stroke();
  }

  function drawMinChartCoordinates(c, p, clr, lw) {
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(p.x, p.y + p.h);
    c.lineTo(p.w, p.y + p.h);
    c.strokeStyle = clr;
    c.lineWidth = lw;
    c.stroke();
  }

  function setUpCnvs(c, w, h) {
    c.style.margin = 'auto';
    c.style.display = 'block';
    c.width = w || document.body.scrollWidth * 0.98;
    c.height = h || document.body.scrollHeight * 0.98;
    return { c, w: c.width, h: c.height };
  }

  function findMaxMin(array, actvz) {
    if (array[0].startsWith('x')) {
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