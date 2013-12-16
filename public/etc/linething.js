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

var LineThing = (function ()
{
  function extend(obj, ext)
  {
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
    step: 5,
    color1: 'rgba(47, 47, 47, 0)',
    color2: 'rgba(47, 47, 47, 0.3)',
    color3: 'rgba(47, 47, 47, 0)',
    bgColor: '#ccc'
  };
  var TOP = 0,
    LEFT = 1,
    BOTTOM = 2,
    RIGHT = 3;
  var canvas,
    ctx,
    mouse = {x: 0, y: 0},
    pos1 = new Point(0, 0, TOP),
    pos2 = new Point(0, 0, BOTTOM),
    active = true,
    reqId;

  function Point(x, y, side)
  {
    this.x = x;
    this.y = y;
    this.side = side;
  }

  Point.prototype.move = function (step)
  {
    var x, y;
    switch (this.side)
    {
      case TOP:
        x = this.x + L.step;
        if (x > L.width)
        {
          this.side = RIGHT;
          log('on top, switching to right');
        }
        else
          this.x = x;
        break;
      case BOTTOM:
        x = this.x - L.step;
        if (x < 0)
        {
          this.side = LEFT;
          log('on bottom, switching to left');
        }
        else
          this.x = x;
        break;
      case RIGHT:
        y = this.y + L.step;
        if (y > L.width)
        {
          this.side = BOTTOM;
          log('on right, switching to bottom');
        }
        else
          this.y = y;
        break;
      case LEFT:
        y = this.y - L.step;
        if (y < 0)
        {
          this.side = TOP;
          log('on left, switching to top');
        }
        else
          this.y = y;
        break;
    }
  };
  Point.prototype.draw = function (pt2)
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
      step: opts.step ? parseInt(opts.step) : undefined,
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
    pos1 = new Point(0, 0, TOP);
    pos2 = new Point(L.width, L.height, BOTTOM);
    L.start();
  };

  function log()
  {
    //console.log.apply(console, arguments);
  }

  L.tick = function ()
  {
    if (!active)
      return;
    pos1.move(L.step);
    pos2.move(L.step);
    pos1.draw(mouse);
    pos2.draw(mouse);
    reqId = window.requestAnimationFrame(L.tick);
  };
  return L;
})();
