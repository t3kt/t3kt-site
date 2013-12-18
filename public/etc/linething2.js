var LineThing2 = (function ()
{
  function extend(obj, ext)
  {
    if (!ext)
      return obj;
    for (var key in ext)
    {
      if (ext.hasOwnProperty(key) && ext[key] != null)
        obj[key] = ext[key];
    }
    return obj;
  }

  function getAbsolutePosition(element)
  {
    var r = { x: element.offsetLeft, y: element.offsetTop };
    if (element.offsetParent)
    {
      var tmp = getAbsolutePosition(element.offsetParent);
      r.x += tmp.x;
      r.y += tmp.y;
    }
    return r;
  }

  function _bind(elem, events, rem, add)
  {
    for (var type in events)
    {
      if (events.hasOwnProperty(type))
      {
        if (rem)
          elem.removeEventListener(type, events[type]);
        if (add)
          elem.addEventListener(type, events[type]);
      }
    }
  }

  function rebind(elem, events)
  {
    _bind(elem, events, true, true);
  }

  function bind(elem, events)
  {
    _bind(elem, events, false, true);
  }

  function unbind(elem, events)
  {
    _bind(elem, events, true, false);
  }

  var L = {
    width: 500,
    height: 500,
    step: 0.005,
    color1: 'rgba(47, 47, 47, 0)',
    color2: 'rgba(47, 47, 47, 0.3)',
    color3: 'rgba(47, 47, 47, 0)',
    bgColor: '#ccc'
  };
  var canvas,
    ctrlCanvas,
    ctx,
    ctrlCtx,
    mouse = {x: 0, y: 0},
    pos1,
    pos2,
    active = true,
    reqId,
    pathPointRadius = 10;

  function StateMachine(states)
  {
    this.states = {};
    var self = this;
    if (Array.isArray(states))
    {
      states.forEach(function (s)
      {
        self.addState(s);
      });
    }
    else if (states)
    {
      extend(this.states, states);
    }
  }

  L.StateMachine = StateMachine;

  StateMachine.prototype = {
    addState: function (id, update, opts)
    {
      if (id.id)
        this.states[id.id] = id;
      else
        this.states[id] = new State(id, update, opts);
      return this;
    },
    goTo: function (id)
    {
      var state = this.states[id];
      if (!state)
        throw new Error('state not found: ' + id);
      this.current = state;
      return this;
    },
    update: function (params)
    {
      return this.current && this.current.update(this, params);
    }
  };

  function State(id, update, opts)
  {
    this.id = id;
    this.update = function (machine, params)
    {
      var next = update.apply(this, params);
      if (next)
        machine.goTo(next);
    };
    extend(this, opts);
  }

  function PathState(opts)
  {
    var start, end, range, next;

    this.init = function (opts)
    {
      start = opts.start;
      end = opts.end;
      range = [end[0] - start[0], end[1] - start[1]];
      next = opts.next;
    };

    this.init(opts);

    State.call(this, opts.id,
      function (point, rate)
      {
        point.i += rate;
        if (point.i > 1)
        {
          point.x = end[0];
          point.y = end[1];
          point.i = 0;
          return next;
        }
        point.x = start[0] + range[0] * point.i;
        point.y = start[1] + range[1] * point.i;
        return null;
      });

    this.draw = function (c)
    {
      c.save();
      c.lineWidth = 2;
      c.strokeStyle = 'rgba(0,20,90,0.3)';
      c.beginPath();
      c.arc(start[0], start[1], pathPointRadius, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = 'rgba(0,90,20,0.3)';
      c.beginPath();
      c.arc(end[0], end[1], pathPointRadius / 2, 0, Math.PI * 2);
      c.stroke();
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(0,90,90,0.3)';
      c.beginPath();
      c.moveTo(start[0], start[1]);
      c.lineTo(end[0], end[1]);
      c.stroke();
      c.restore();
    };
  }

  function Point(states, start)
  {
    this.i = 0;
    this.x = 0;
    this.y = 0;
    this.stateMachine = new StateMachine(states)
      .goTo(start);
  }

  Point.prototype.move = function (rate)
  {
    this.stateMachine.update([this, rate]);
    return this;
  };

  Point.prototype.lineTo = function (pt2)
  {
    ctx.save();
    var gradient = ctx.createLinearGradient(0 | this.x, 0 | this.y, 0 | pt2.x, 0 | pt2.y);
    gradient.addColorStop(1, L.color1);
    gradient.addColorStop(0.5, L.color2);
    gradient.addColorStop(0, L.color3);
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0 | this.x, 0 | this.y);
    ctx.lineTo(0 | pt2.x, 0 | pt2.y);
    ctx.stroke();
    ctx.restore();
    return this;
  };
  function updateMousePosition(e)
  {
    if ('offsetX' in e)
    {
      mouse.x = e.offsetX;
      mouse.y = e.offsetY;
    }
    else
    {
      var cpos = getAbsolutePosition(this);
      mouse.x = e.screenX - cpos.x;
      mouse.y = e.screenY - cpos.y;
    }
  }

  L.start = function ()
  {
    active = true;
    if (!reqId)
      reqId = window.requestAnimationFrame(L.tick);
  };

  L.stop = function ()
  {
    active = false;
    if (reqId)
      window.cancelAnimationFrame(reqId);
    reqId = null;
  };

  L.drawControlLayer = function ()
  {
    ctrlCtx.clearRect(0, 0, L.width, L.height);
    L.paths.forEach(function (path)
    {
      path.draw(ctrlCtx);
    });
  };

  var mouseEvents = {
    mousemove: updateMousePosition,
    mouseover: L.start,
    mouseout: L.stop
  };

  L.init = function (opts)
  {
    L.container = opts.container;
    L.canvas = canvas = opts.canvas;
    L.ctrlCanvas = ctrlCanvas = opts.ctrlCanvas;
    extend(L, {
      step: opts.step ? parseFloat(opts.step) : undefined,
      color1: opts.color1,
      color2: opts.color2,
      color3: opts.color3,
      bgColor: opts.bgColor,
      width: parseInt(opts.width),
      height: parseInt(opts.height)
    });
    L.stop();
    canvas.width = ctrlCanvas.width = L.width;
    canvas.height = ctrlCanvas.height = L.height;
    L.container.style.width = L.width + 'px';
    L.container.style.height = L.height + 'px';
    L.container.style.backgroundColor = L.bgColor;
    rebind(canvas, mouseEvents);
    L.ctx = ctx = canvas.getContext('2d');
    ctx.save();
    ctx.fillStyle = L.bgColor;
    ctx.fillRect(0, 0, L.width, L.height);
    ctx.restore();
    L.ctrlCtx = ctrlCtx = ctrlCanvas.getContext('2d');
//    pos1 = new Point(0, 0);
//    pos1.states = makeSidesMachine_2(this).goTo('top');
//    pos2 = new Point(L.width, L.height);
//    pos2.states = makeSidesMachine_2(this).goTo('bottom');

    L.paths = opts.paths.map(function (p)
    {
      return new PathState(p);
    });
    pos1 = new Point(L.paths, opts.point1start);
    pos2 = new Point(L.paths, opts.point2start);
    L.start();
  };

  L.reinitPaths = function (pathOpts)
  {
    pathOpts.forEach(function (p, i)
    {
      L.paths[i].init(p);
    });
    L.drawControlLayer();
  };

  L.toggleControlLayer = function (show)
  {
    ctrlCanvas.style.display = show ? 'block' : 'none';
    canvas.style.opacity = show ? '0.5' : '1';
    if (show)
      L.drawControlLayer();
    if (show)
    {
      unbind(canvas, mouseEvents);
      bind(ctrlCanvas, mouseEvents);
    }
    else
    {
      unbind(ctrlCanvas, mouseEvents);
      bind(canvas, mouseEvents);
    }
  };

  L.tick = function ()
  {
    if (!active)
      return;
    pos1.move(L.step).lineTo(mouse);
    pos2.move(L.step).lineTo(mouse);
    reqId = window.requestAnimationFrame(L.tick);
  };


  return L;
})();

$(function ()
{
  function makeColor(rgb, alpha)
  {
    if (!rgb)
      return null;
    if (rgb.length == 7 && rgb.charAt(0) == '#')
    {
      return 'rgba(' + parseInt(rgb.substr(1, 2), 16) + ',' +
        parseInt(rgb.substr(3, 2), 16) + ',' +
        parseInt(rgb.substr(5, 2), 16) + ',' +
        alpha + ')';
    }
    return rgb;
  }

  function getFormValues()
  {
    var vals = {};
    $('#linething-options :input[name]').each(function ()
    {
      if (this.type != 'radio' || this.checked)
        vals[this.name] = this.value;
    });
    return vals;
  }

  function updateOptions()
  {
    var vals = getFormValues();
    var opts = {
      width: vals.width,
      height: vals.height,
      step: vals.step,
      color1: makeColor(vals['color1-rgb'], vals['color1-alpha']),
      color2: makeColor(vals['color2-rgb'], vals['color2-alpha']),
      color3: makeColor(vals['color3-rgb'], vals['color3-alpha']),
      bgColor: makeColor(vals['bgcolor-rgb'], vals['bgcolor-alpha']),
      point1start: vals.point1start,
      point2start: vals.point2start,
      paths: buildPathOpts(vals),
      container: $('#linething-canvas-container')[0],
      canvas: $('#linething-canvas')[0],
      ctrlCanvas: $('#linething-control-canvas')[0]
    };
    LineThing2.init(opts);
    return false;
  }

  function buildPathOpts(vals)
  {
    return [
      {id: vals.path1id, start: [vals.path1startx * vals.width, vals.path1starty * vals.height], end: [vals.path1endx * vals.width, vals.path1endy * vals.height], next: vals.path1next},
      {id: vals.path2id, start: [vals.path2startx * vals.width, vals.path2starty * vals.height], end: [vals.path2endx * vals.width, vals.path2endy * vals.height], next: vals.path2next},
      {id: vals.path3id, start: [vals.path3startx * vals.width, vals.path3starty * vals.height], end: [vals.path3endx * vals.width, vals.path3endy * vals.height], next: vals.path3next},
      {id: vals.path4id, start: [vals.path4startx * vals.width, vals.path4starty * vals.height], end: [vals.path4endx * vals.width, vals.path4endy * vals.height], next: vals.path4next}
    ];
  }

  $('#linething-options')
    .find('input[name*=startx], input[name*=starty], input[name*=endx], input[name*=endy]')
    .change(function ()
    {
      var vals = getFormValues(),
        paths = buildPathOpts(vals);
      LineThing2.reinitPaths(paths);
    });

  $('#linething-capture-button').click(function ()
  {
    var dataurl = LineThing2.canvas.toDataURL();
    window.open(dataurl);
    //$('#linething-capture-image').show().attr('src', dataurl);
  });

  $('#linething-show-control-layer').change(function ()
  {
    LineThing2.toggleControlLayer(this.checked);
  });

  $('#linething-options').submit(function ()
  {
    updateOptions();
    return false;
  });
  $('#linething-canvas').one('mousemove', function ()
  {
    updateOptions();
  });
});