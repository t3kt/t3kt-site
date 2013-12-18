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

  function rebind(elem, events)
  {
    for (var type in events)
    {
      if (events.hasOwnProperty(type))
      {
        elem.removeEventListener(type, events[type]);
        elem.addEventListener(type, events[type]);
      }
    }
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
    paths;

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
    var range = [opts.end[0] - opts.start[0], opts.end[1] - opts.start[1]];
    State.call(this, opts.id,
      function (point, rate)
      {
        point.i += rate;
        if (point.i > 1)
        {
          point.x = this.end[0];
          point.y = this.end[1];
          point.i = 0;
          return this.next;
        }
        point.x = this.start[0] + range[0] * point.i;
        point.y = this.start[1] + range[1] * point.i;
        return null;
      },
      opts);
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
    
  };

  L.init = function (opts)
  {
    opts = opts || {};
    L.canvas = canvas = opts.canvas;
    L.ctrlCanvas = ctrlCanvas = opts.ctrlCanvas;
    extend(L, {
      step: opts.step ? parseFloat(opts.step) : undefined,
      color1: opts.color1,
      color2: opts.color2,
      color3: opts.color3,
      bgColor: opts.bgColor,
      width: opts.width ? parseInt(opts.width) : c.width,
      height: opts.height ? parseInt(opts.height) : c.height
    });
    L.stop();
    canvas.width = ctrlCanvas.width = L.width;
    canvas.height = ctrlCanvas.height = L.height;
    opts.container.style.width = L.width + 'px';
    opts.container.style.height = L.height + 'px';
    rebind(canvas, {
      mousemove: updateMousePosition,
      mouseover: L.start,
      mouseout: L.stop
    });
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

  L.toggleControlLayer = function (show)
  {
    //TODO
  };

  function log(msg)
  {
    //console.log.apply(console, arguments);
  }

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

  function updateOptions()
  {
    var vals = {};
    $('#linething-options :input[name]').each(function ()
    {
      if (this.type != 'radio' || this.checked)
        vals[this.name] = this.value;
    });
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
      paths: [
        {id: vals.path1id, start: [vals.path1startx * vals.width, vals.path1starty * vals.height], end: [vals.path1endx * vals.width, vals.path1endy * vals.height], next: vals.path1next},
        {id: vals.path2id, start: [vals.path2startx * vals.width, vals.path2starty * vals.height], end: [vals.path2endx * vals.width, vals.path2endy * vals.height], next: vals.path2next},
        {id: vals.path3id, start: [vals.path3startx * vals.width, vals.path3starty * vals.height], end: [vals.path3endx * vals.width, vals.path3endy * vals.height], next: vals.path3next},
        {id: vals.path4id, start: [vals.path4startx * vals.width, vals.path4starty * vals.height], end: [vals.path4endx * vals.width, vals.path4endy * vals.height], next: vals.path4next}
      ],
      container: $('#linething-canvas-container')[0],
      canvas: $('#linething-canvas')[0],
      ctrlCanvas: $('#linething-control-canvas')[0]
    };
    LineThing2.init(opts);
    return false;
  }

  $('#linething-capture-button').click(function ()
  {
    var dataurl = LineThing2.canvas.toDataURL();
    window.open(dataurl);
    //$('#linething-capture-image').show().attr('src', dataurl);
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