(function ()
{
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x)
  {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function (callback, element)
    {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function ()
        {
          callback(currTime + timeToCall);
        },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function (id)
    {
      clearTimeout(id);
    };
}());

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
    ctx,
    mouse = {x: 0, y: 0},
    pos1,
    pos2,
    active = true,
    reqId;

  function StateMachine()
  {
    this.states = {};
  }

  StateMachine.prototype = {
    withState: function (id, update, opts)
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
    update: function (param)
    {
      return this.current && this.current.update(this, param);
    }
  };

  function State(id, update, opts)
  {
    this.id = id;
    this.update = function (machine, param)
    {
      var next = update.call(this, param);
      if (next)
        machine.goTo(next);
    };
    extend(this, opts);
  }

  L.StateMachine = StateMachine;

  function makeSidesMachine_2(point)
  {
    return new StateMachine()
      .withState('top', linearUpdate(point, [0, 0], [L.width, 0], 'right'))
      .withState('right', linearUpdate(point, [L.width, 0], [L.width, L.height], 'bottom'))
      .withState('bottom', linearUpdate(point, [L.width, L.height], [0, L.height], 'left'))
      .withState('left', linearUpdate(point, [0, L.height], [0, 0], 'top'));
  }

  function makePathsMachine(point, paths)
  {
    var machine = new StateMachine();
    paths.forEach(function (path)
    {
      machine.withState(path.id, linearUpdate(point, path.start, path.end, path.next));
    });
    return machine;
  }

  function linearUpdate(point, start, end, next)
  {
    var i = 0,
      range = [end[0] - start[0], end[1] - start[1]];
    return function (rate)
    {
      i += rate;
      if (i > 1)
      {
        i = 0;
        return next;
      }
      point.x = start[0] + range[0] * i;
      point.y = start[1] + range[1] * i;
      return null;
    };
  }

  function Point(x, y)
  {
    this.x = x;
    this.y = y;
  }

  Point.prototype.move = function (step)
  {
    this.states.update(step);
    return this;
  };
  Point.prototype.lineTo = function (pt2)
  {
    ctx.save();
    var gradient = ctx.createLinearGradient(this.x, this.y, pt2.x, pt2.y);
    gradient.addColorStop(1, L.color1);
    gradient.addColorStop(0.5, L.color2);
    gradient.addColorStop(0, L.color3);
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(pt2.x, pt2.y);
    ctx.stroke();
    ctx.restore();
    return this;
  };

  function updateMousePosition(e)
  {
    mouse.x = e.offsetX;
    mouse.y = e.offsetY;
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


  L.init = function (c, opts)
  {
    opts = opts || {};
    L.canvas = canvas = c;
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
    canvas.width = L.width;
    canvas.height = L.height;
    canvas.removeEventListener('mousemove', updateMousePosition);
    canvas.removeEventListener('mouseover', L.start);
    canvas.removeEventListener('mouseout', L.stop);
    canvas.addEventListener('mousemove', updateMousePosition);
    canvas.addEventListener('mouseover', L.start);
    canvas.addEventListener('mouseout', L.stop);
    L.ctx = ctx = canvas.getContext('2d');
    ctx.save();
    ctx.fillStyle = L.bgColor;
    ctx.fillRect(0, 0, L.width, L.height);
    ctx.restore();
//    pos1 = new Point(0, 0);
//    pos1.states = makeSidesMachine_2(this).goTo('top');
//    pos2 = new Point(L.width, L.height);
//    pos2.states = makeSidesMachine_2(this).goTo('bottom');

    pos1 = new Point(0, 0);
    pos1.states = makePathsMachine(pos1, opts.paths).goTo(opts.point1start);
//    pos2 = new Point(L.width, L.height);
//    pos2.states = makePathsMachine(pos2, opts.paths).goTo(opts.point2start);
    L.start();
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
//    pos2.move(L.step).lineTo(mouse);
    reqId = window.requestAnimationFrame(L.tick);
  };


  return L;
})();