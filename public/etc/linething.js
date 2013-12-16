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
    pos = {x: 0, y: 0},
    side = TOP,
    active = true,
    reqId;

  function updateMousePosition(e)
  {
    mouse.x = e.offsetX;
    mouse.y = e.offsetY;
  }

  function start()
  {
    active = true;
    if (!reqId)
      reqId = window.requestAnimationFrame(L.tick);
  }

  function stop()
  {
    active = false;
    if (reqId)
      window.cancelAnimationFrame(reqId);
    reqId = null;
  }

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
    stop();
    canvas.width = L.width;
    canvas.height = L.height;
    canvas.removeEventListener('mousemove', updateMousePosition);
    canvas.removeEventListener('mouseover', start);
    canvas.removeEventListener('mouseout', stop);
    canvas.addEventListener('mousemove', updateMousePosition);
    canvas.addEventListener('mouseover', start);
    canvas.addEventListener('mouseout', stop);
    L.ctx = ctx = canvas.getContext('2d');
    ctx.save();
    ctx.fillStyle = L.bgColor;
    ctx.fillRect(0, 0, L.width, L.height);
    ctx.restore();
    start();
  };

  function log()
  {
    //console.log.apply(console, arguments);
  }

  L.move = function ()
  {
    var x, y;
    switch (side)
    {
      case TOP:
        x = pos.x + L.step;
        if (x > L.width)
        {
          side = RIGHT;
          log('on top, switching to right');
        }
        else
          pos.x = x;
        break;
      case BOTTOM:
        x = pos.x - L.step;
        if (x < 0)
        {
          side = LEFT;
          log('on bottom, switching to left');
        }
        else
          pos.x = x;
        break;
      case RIGHT:
        y = pos.y + L.step;
        if (y > L.width)
        {
          side = BOTTOM;
          log('on right, switching to bottom');
        }
        else
          pos.y = y;
        break;
      case LEFT:
        y = pos.y - L.step;
        if (y < 0)
        {
          side = TOP;
          log('on left, switching to top');
        }
        else
          pos.y = y;
        break;
    }
    //TODO
  };

  L.draw = function ()
  {
    //ctx.strokeStyle = L.color;
    var gradient = ctx.createLinearGradient(pos.x, pos.y, mouse.x, mouse.y);
    gradient.addColorStop(1, L.color1);
    gradient.addColorStop(0.5, L.color2);
    gradient.addColorStop(0, L.color3);
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
  };

  L.tick = function ()
  {
    if (!active)
      return;
    L.move();
    L.draw();
    reqId = window.requestAnimationFrame(L.tick);
  };
  return L;
})();
