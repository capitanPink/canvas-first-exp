// refactor miniature doesnt shows correctly with different diagrams + 
// refactor if all lines disabled we have no NaNs on left grid + 
// refactor if all diagrams turned off and switch to another mode and press main chart - bug + 
// change drawVal on touchMove +

// need code refactor - 
// refactor getClr - shouldn't be execute at every places - 
// refactor dates scrolling - 
// refactor last date shouldn't change - 
// refactor incorrect left amount with different diagrams - 
// fix moving square - 
// Add mouse events - 

 function Chart(opt) {
  const _this = this;
  const { keys, values } = Object;
  const RAF = window.requestAnimationFrame;

  const PERIOD = opt.period || 1000 * 60 * 60 * 24;
  const POINTS = opt.points || 6;
  const CLRS = {
    AXIS: '#8282823b',
    BOX_BRDR: '#ddeaf3',
    BOX: '#f5f9fb',
    WHITE: '#ffffff',
    FONT: '#999c9e',
    LBL: '',
    BLACK: '#000000',
    MODE: '#008cea',
    NIGHT: '#222f3f',
    NAXIS: '#ecf0f314',
    NMBOX: '#1e2938',
    NLBL: '#0a0a0a66'
  };
  const FF = opt.fontFamaly || 'Roboto';
  const font = `${opt.fontSize || 9}pt ${FF}`;
  const fontlbl = `${opt.fontLblSize || 10}pt ${FF}`;
  const fontHdr = `${opt.fontHdrSize || 10}pt ${FF}`;
  const fontMode = `${opt.fontHdrSize || 14}pt ${FF}`;
  const el = opt.elem;
  const cvr = document.createElement('div');
  
  let { c, w, h } = setUpCnvs(document.createElement('canvas'), opt.width, opt.height);
  const ctx = c.getContext('2d');
  const btns = [];

  const chrtP = {
    x: 0,
    y: h * 0.05,
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

  const sWP = {
    txtD: 'Switch to day mode',
    txtN: 'Switch to night mode',
    x: w / 2,
    y: h * 0.95 - parseInt(fontMode) * 2,
    nMd: true,
    th: parseInt(fontMode) * 2,
    tw() {
      return mesT(ctx, this.nMd ? this.txtN : this.txtD);
    }
  };

  const bgClr = () => (sWP.nMd ? CLRS.NIGHT : CLRS.WHITE);
  const axClr = () => (sWP.nMd ? CLRS.NAXIS : CLRS.AXIS);
  const mBoxClr = () => (sWP.nMd ? CLRS.NMBOX : CLRS.BOX);
  const txtClr = () => (sWP.nMd ? CLRS.WHITE : CLRS.BLACK);
  const lblClr = () => (sWP.nMd ? CLRS.NLBL : CLRS.LBL);

  const flgs = {};

  let xl, yl, nmsClrs;

  const actvz = {
    s: null,
    e: null,
    length: null
  };

  function build(data) {
    _this.data = data;
    nmsClrs = keys(data.names).map((e) => [e, data.names[e], data.colors[e]]);
    drawRect(ctx, 0, 0, w, h, bgClr());

    drawChart(data, minChartProps, nmsClrs, true);
    bindEvents(data, c, minChartProps, chrtP, CLRS);

    el.appendChild(cvr);
    cvr.style.backgroundColor = bgClr();
    cvr.appendChild(c);
  }

  function drawChart(data, p, nmsClrs, init, bgDr, swM) {
    if (bgDr) {
      drawRect(ctx, 0, 0, w, h, bgClr());
    }

    const chartCols = data.columns;
    const mergedCols = mrgCls(chartCols);
    xl = fndMxMn(mergedCols.x, actvz, true);
    yl  = fndMxMn(mergedCols.y, actvz);

    drawDwnBtn(ctx, sWP.nMd ? sWP.txtD : sWP.txtN, sWP, 'center', 'middle', CLRS.MODE, fontMode);
    drawMinChart(data, ctx, minChartProps, CLRS);
    drawButtons(ctx, p.x, p.y + p.h + h * 0.03, nmsClrs, init, bgDr, swM);
  }

  function drawMinChart(data, c, p, clrs, d = {}, m) {
    RAF(() => {
      clearChart(c, 0, p.y, p.w, p.h);
      drawRect(c, 0, p.y, p.w, p.h + 1, bgClr());
      drawMovingSquire(data, c, p, clrs, d, m);
    });
  }

  function bindEvents(data, c, p, pMain, clrs) {
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
      let f = false;
      btns.forEach((e, i) => {
        if (x > e[3] && x < e[3] + e[4] && y > e[6] && y < e[6] + e[5]) {
          toggleBtnState(c, e[7], e[8], e[5], [e[0], e[1], e[2]], flgs[e[0]] = !flgs[e[0]]);
          drawChart(filterData(_this.data, flgs), minChartProps, nmsClrs);
          f = true;
        }
      });
      return f;
    }

    function handleSwMTouch(x, y, s) {
      const tw = s.tw();
      if (x > s.x - tw / 1.3 && x < s.x + tw / 1.3  && y > s.y - s.th / 1.3  && y < s.y + s.th / 1.3 ) {
        s.nMd = !s.nMd;
        drawChart(filterData(_this.data, flgs), minChartProps, nmsClrs, false, true, true);
        cvr.style.backgroundColor = bgClr();
        return true;
      }
    }

    function handleTouchEnd(event) {
      const { clientX } = event.changedTouches[0];
  
      if (self.isDL) {
        if (self.isB2sm) self.clxs = p.xBox;
        else self.clxs = clientX;
        self.isDL = null;
      } else if (self.isDR) {
        if (!self.isB2sm) self.clxe = clientX;
        else self.clxe = p.xBox + p.boxW;
        self.isDR = null;
      }
    }
  
    function handleTouchStart(event) {
      self.prev = undefined;
      const { clientX, clientY } = event.touches[0];

      if (handleBtnsOnTouch(ctx, clientX, clientY)
        || handleSwMTouch(clientX, clientY, sWP)
        || showVal(clientX, clientY)) return;

      isInMin = clientY > p.y && clientY < p.y + p.h;
      self.isDL = inClxs(clientX, getClxslim()) && isInMin;
      self.isDR = inClxe(clientX, getClxelim()) && isInMin;
      self.Mvd = clientX > self.clxs && clientX < self.clxs + p.boxW && isInMin;

      if (self.Mvd) {
        self.diffs.xl = clientX - self.clxs;
        self.diffs.xr = self.clxe - clientX;
      }
    }

    function showVal(clientX, clientY) {
      if (isInM(clientX, clientY, pMain)) {
        drawMainChart(filterData(_this.data, flgs), ctx, chrtP, actvz, PERIOD, CLRS, { clientX, clientY });
        return true;
      }
    }
  
    function handleTouchMove(event) {
      const { clientX, clientY } = event.touches[0];
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

      if (showVal(clientX, clientY)) return;

      if (isDrggbl) {
        
        if (self.isMvr) {
          if (!self.isMvr && self.isB2sm) {
            
            } else {
              const d = { xl: self.isDL && clientX, xr: self.isDR && clientX };
              drawMinChart(filterData(_this.data, flgs), ctx, p, clrs, d);
            }
        } else if (self.isMvl) {
          if (!self.isMvl && self.isB2sm) {
            
            } else {
              const d = { xl: self.isDL && clientX, xr: self.isDR && clientX };
              drawMinChart(filterData(_this.data, flgs), ctx, p, clrs, d);
            }
        } else if (!self.isB2sm) {
          const d = { xl: self.isDL && clientX, xr: self.isDR && clientX };
          drawMinChart(filterData(_this.data, flgs), ctx, p, clrs, d);
        }
        
        
      } else if (isMvbl) {
        self.clxs = clientX - self.diffs.xl;
        self.clxe = clientX + self.diffs.xr;
        drawMinChart(filterData(_this.data, flgs), ctx, p, clrs, {}, self.clxs);
      }
    }

    function isInM(x, y, p) {
      return x >= p.x && x <= p.w && y >= p.y * 0.8 && y <= p.h + p.y;
    }

    function getClxslim() {
      return { d: this.clxs - 7, t: this.clxs + 15 };
    }

    function getClxelim() {
      return { d: this.clxe + 5, t: this.clxe + 20 };
    }

    function inClxs(clx, clxslim) {
      return clx > clxslim.d && clx < clxslim.t;
    }

    function inClxe(clx, clxelim) {
      return clx > clxelim.d && clx < clxelim.t;
    }
  }

  function fndIndxs(w, actvz) {
    const i = w / actvz.length;
    return {
      s: Math.round(actvz.s / i),
      e: Math.round(actvz.e / i)
    };
  }

  function getArCut(cols, indxs) {
    return cols.map((a) => [a[0]].concat(a.slice(indxs.s, indxs.e + 1)));
  }

  function drawMovingSquire(data, c, p, clrs, d, mX) {
    const temp = d.xl ? p.xBox - d.xl : 0;
    p.xBox = mX || d.xl || p.xBox;
    p.boxW = d.xr ? d.xr - p.xBox : d.xl ? p.boxW + temp : p.boxW;
    const shft = p.w - p.xBox - p.boxW;
    actvz.s = p.xBox;
    actvz.e = p.xBox + p.boxW;

    const bw = p.boxW;
    const bh = p.boxH;
    const x = p.xBox;
    const y = p.yBox;
    
    drawRect(c, x - 5, y - 1, bw + 10, bh + 2, clrs.BOX_BRDR, 0.6);
    drawRect(c, x, y, bw - 1, bh, bgClr());
    drawMiniature(data, c, w, h, p, xl, yl, PERIOD);
    drawRect(c, p.x, p.y, x - 4, p.h, mBoxClr(), 0.8);
    drawRect(c, x + p.boxW + 4, p.y, p.w - x + p.boxW, p.h, mBoxClr(), 0.8);
    drawMainChart(data, ctx, chrtP, actvz, PERIOD, CLRS, null, shft);
  }

  function drawRect(c, x, y, w, h, clr, glA) {
    c.save();
    c.beginPath();
    c.globalAlpha = glA || 1;
    c.fillStyle = clr;
    c.fillRect(x, y, w, h);
    c.restore();
  }

  function drawDwnBtn(c, t, s, al, tb, clr, fnt) {
    clearChart(c, 0, s.y - s.th,  w, h - s.y + s.th);
    drawRect(c, 0, s.y - s.th - 1,  w, h - s.y + s.th, bgClr());
    drawTxt(ctx, t, s.x, s.y, al, tb, clr, fnt);
  }

  function drawMainChart(data, c, p, actvz, per, CLRS, val, shft) {
    const clrs = values(data.colors);    
    const indxs = fndIndxs(p.w, actvz);
    const aCut = getArCut(data.columns, indxs);
    const mCls = mrgCls(aCut);
    const xlc = fndMxMn(mCls.x, actvz);
    const ylc  = fndMxMn(mCls.y, actvz);
    const { stX } = getSteps(p.w, p.h * 0.8, xlc, ylc, per);

    const yc = p.y + p.h + (p.y + p.h) * 0.06
    let fFlag = true;
    const vals = {};
    
    clearChart(c, p.x, 0, p.w, yc);
    drawRect(c, p.x, 0, p.w, yc + 2, bgClr());
    drawChrtCrdnts(c, p, axClr(), xlc, ylc, data.columns.find(e => e[0].startsWith('x')), indxs, shft);

    for(let i = aCut.length - 1; i > 0; i--) {
      const clr = clrs[i - 1];
      fFlag = true;
      vals[aCut[i][0]] = {};

      c.beginPath();
      for (let j = 1, x = p.x; j < aCut[i].length; j++, x += stX) {
        const y = p.h + p.y - (p.h / 1.3 * aCut[i][j] / ylc.max)

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
      drawVal(data, c, p, vals, xlc);
    }
  }

  function drawVal(data, c, p, vals, xlc) {
    if (!keys(vals).length) return;

    const valsVls = values(vals);
    const valsNms = keys(vals);
    const { names } = data;
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
        c.strokeStyle = axClr();
        c.lineWidth = p.clw;
        c.stroke();
      }
      const mls = getMxLLn(c, names[valsNms[i]], e.yv) + 10;
      drawArc(c, e.x, e.y, 5, 0, 2 * Math.PI, e.clr, bgClr(), 2);
      lsA.push(getLSz(names[valsNms[i]], mls, lch, e.yv, e.clr));
      cmnw += mls;
    });

    const bw = cmnw > tw ? cmnw : tw;
    const hfh = parseInt(fontHdr);
    const lh = hfh + parseInt(lsA.reduce((a, n) => a < n[2] ? n[2] : a, 0)) + 20;
    const { x, y } = findBoxCoord(curx, p, bw, lh);

    roundRect(c, x, y, bw, lh, 3, lblClr(), bgClr(), true);
    drawTxt(c, t, x + bw/2, y + hfh * 0.5, 'center', 'top', txtClr());

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

  function drawButtons(c, x, y, nmsClrs, init, bgDr, swM) {
    if (!init && !bgDr) return;
    this.pw;
    const btnH = parseInt(fontHdr) * 3.5;
    const yCl = y - 3;
    const hCl = btnH + btnH * 0.3;
    clearChart(c, 0, yCl, w, hCl);
    drawRect(c, 0, yCl - 1, w, hCl + 2, bgClr());
    nmsClrs.forEach((e, i) => drawButton(c, x, y, btnH, e, i, this.px, init, swM));
  }

  function drawButton(c, x, y, btnH, e, i, pw, init, swM) {
    const txtW = mesT(c, e[1]);
    const bw = w * 0.2 > 30 + txtW ? w * 0.2 : 30 + txtW;
    const bx = x + (bw + (i ? 10 : 0)) * i;
    const xa = bx + btnH * 0.5;
    const ya = y + btnH * 0.5;
    btns[i] = [...e, bx, bw, btnH, y, xa, ya, true];

    if (init) {
      flgs[e[0]] = true;
    }
    roundRect(c, bx, y, bw , btnH, btnH * 0.5, axClr(), bgClr());
    drawTxt(c, e[1], bx + bw * 0.6, ya + btnH * 0.05, 'center', 'middle', txtClr(), fontHdr);
    toggleBtnState(c, xa, ya, btnH, e, flgs[e[0]], init, swM);
    
  }

  function toggleBtnState(c, xa, ya, btnH, e, actv, init, swM) {
    const wrp = (c, xa, ya, r, sA, eA, sc, fc, b, i) => {
      drawArc(c, xa, ya, r, sA, eA, sc, fc, b)
      if (i === (swM ? 0 : 19)) drawTick(c, xa - 6, ya, 2, CLRS.WHITE);
    };

    if (init) {
      return wrp(c, xa, ya, btnH * 0.3 , 0, 2 * Math.PI, bgClr(), e[2], 0, 19)
    }

    if (actv) {
      if (swM) {
        wrp(c, xa, ya, btnH * 0.28 , 0, 2 * Math.PI, e[2], swM ? e[2] : '#0000', 1, 0);
        return;
      }
      
      const rst = btnH * 0.24 / 20;
      for (let i = 0, r = btnH * 0.24; i < (swM ? 1 : 20); i++, r -= rst) {
        setTimeout(() => wrp(c, xa, ya, r , 0, 2 * Math.PI, e[2], swM ? e[2] : '#0000', 1, i), 11 * i)        
      }
    } else {
      if (swM) {
        drawArc(c, xa, ya, btnH * 0.25 , 0, 2 * Math.PI, e[2], swM ? bgClr() : '#0000', 3)
        return;
      }

      const rst = btnH * 0.19 / 20;
      for (let i = 0, r = 0; i <= (swM ? 0 : 21); i++, r += rst) {
        setTimeout(() => drawArc(c, xa, ya, r , 0, 2 * Math.PI, bgClr(), bgClr(), 0), 9 * i)
      }
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

  function filterData(d, flgs) {
    return keys(d).reduce((a, n) => {
      const isA = d[n] instanceof Array ;
      let temp = isA ? [] : {};
      if (!isA) {
        for (const k in d[n]) {
          if (k.startsWith('x') || k in flgs && flgs[k]) {
            temp[k] = d[n][k];
          }
        }
      } else {
        d[n].forEach(e => {
          if (e[0].startsWith('x') || e[0] in flgs && flgs[e[0]]) temp.push(e);
        })
      }
      return Object.assign({}, a, { [n]: temp })
    }, {});
  }

  function getMxLLn(c, n, y) {
    return Math.max(...[mesT(c, n), mesT(c, y)]);
  }

  function getLSz(n, w, h, y, clr) {
    return [n, w, h, y, clr];
  }

  function mesT(c, v) {
    return c.measureText(v).width;
  }

  function findBoxCoord(x, p, w) {
    const xr = x - 0.25 * w;
    return {
      x: (x + 0.75 * w) > p.w ? p.w - w : x - 0.25 * w < p.x ? p.x : xr,
      y: p.y
    };
  }

  function roundRect(c, x, y, w, h, r, strSt, flSt, isVal) {
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
    isVal && (c.shadowColor = '#0a0a0a08') && (c.shadowBlur = 45);
    c.fillStyle = flSt;
    c.fill()
    c.restore();
  }

  function drawMiniature(chart, c, w, h, p, xl, yl, per) {
    const { stX, stY } = getSteps(w, p.h * 0.85, xl, yl, per);
    const colors = values(chart.colors);
    const cols = chart.columns;

    for (let i = cols.length - 1; i > 0; i--) {
      c.beginPath();
      for (let j = 1, x = p.x; j < cols[i].length; j++, x += stX) {
        const y = (p.y + p.h) - p.h * cols[i][j] / (yl.max * 1.3);
        
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

  function drawChrtCrdnts(c, p, clr, xlc, ylc, d, indxs, shft) {

    dXC(c, p, xlc, getPeriodUTC(xlc), d, indxs, shft);
    dYC(c, p, getYCPer(p, ylc), clr);
  }

  function getPeriodUTC(xlc) {
    return new Date(xlc.max) - new Date(xlc.min);
  }

  function getYCPer(p, ylc) {
    if (!ylc) return ;
    return ylc.max / p.h;
  }

  function dXC(c, p, xlc, t, d, indxs, shft) {
    const st = p.w / POINTS;
    const stdiff = t / p.w;
    const xshft = p.w * 0.06;
    const tshft = stdiff * xshft;
    const yshft = (p.y + p.h) * 0.05

    c.beginPath()
    c.fillStyle = CLRS.FONT;
    c.font = font;

    for (let i = 0, x = p.x; i < POINTS; i++, x += st){
      const y = p.y + p.h;
      const xx = x + xshft;
      const txt = formatDate(getDate(xlc, t, tshft, i), { month: 'short', day: '2-digit' });
      c.lineWidth = p.clw;
      c.moveTo(xx, y);
      drawTxt(c, txt, xx, y + yshft, 'center', 'middle', CLRS.FONT, font);
    }
    c.lineWidth = p.clw;
    c.stroke();
  }

  function dYC(c, p, t, clr) {
    const st = t * p.h / POINTS * 1.3;
    const sty = p.h / POINTS;

    c.save();
    c.beginPath()
    c.fillStyle = CLRS.FONT;
    c.font = font;
    c.strokeStyle = clr;
    for (let i = 0, y = p.y + p.h; i < POINTS; i++, y -= sty) {
      c.moveTo(p.x, y);
      c.lineTo(p.w, y);
      c.fillText(i === 0 ? '0' : t ? round(st * i) : '', p.x, y - 5);
    }
    c.lineWidth = p.clw;
    c.stroke();
    c.restore();
  }

  function getDate(xlc, diff, tshft, pnts) {
    return new Date((xlc.min + diff / POINTS * pnts) + tshft);
  }

  function formatDate(d, f) {
    return d.toLocaleString('en-us', f);
  }

  function setUpCnvs(c, w, h) {
    const dw = document.body.scrollWidth;
    c.style.margin = 'auto';
    c.style.display = 'block';
    c.width = w || dw * 0.94;
    c.height = h || window.innerHeight;
    return { c, w: c.width, h: c.height };
  }

  function clearChart(c, x, y, w, h) {
    c.clearRect(x, y, w, h);
  }

  function round(dgt) {
    const l = dgt.toFixed(0).length;
    if (l === 1) {
      return dgt;
    } else if (l > 1 && l < 4) {
      return Math.round(dgt / 10) * 10;
    } else if (l > 3 && l < 6) {
      return Math.round(dgt / 100) * 100; 
    } else {
      return Math.round(dgt / 1000) * 1000;
    }
  }

  function fndMxMn(array, actvz, isM) {
    if (!array) return ;
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

  function mrgCls(columns) {
    return columns.reduce((acc, next) => 
      (next[0].startsWith('x') && Object.assign({}, acc, { x: [...(acc.x ? acc.x : []), ...next] })) ||
      (next[0].startsWith('y') && Object.assign({}, acc, { y: [...(acc.y ? acc.y : []), ...next] }))
    , {});
  }

  function getSteps(w, h, xl, yl, period) {
    return {
      stX: w / ((xl.max - xl.min) / period),
      stY: yl ? h / (yl.max - yl.min) : 0
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