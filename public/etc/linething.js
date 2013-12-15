var LineThing = (function ()
{
  var L = {
    width: 500,
    height: 500,
    step: 5
  };
  var TOP = 0,
    LEFT = 1,
    BOTTOM = 2,
    RIGHT = 3;
  var canvas,
    ctx,
    mouse = {x: 0, y: 0},
    pos = {x: 0, y: 0},
    side = TOP;

  L.init = function (area)
  {
    canvas = document.createElement('canvas');
    canvas.width = L.width;
    canvas.height = L.height;
    area = area || document.body;
    area.appendChild(canvas);
    canvas.addEventListener('mousemove', function (e)
    {
      //mouse.x = e.clientX;
      //mouse.y = e.clientY;
      mouse.x = e.offsetX;
      mouse.y = e.offsetY;
    });
    ctx = canvas.getContext('2d');
    window.requestAnimationFrame(L.draw);
  };

  function log()
  {
    //console.log.apply(console, arguments);
  }

  function updatePosition()
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
  }

  L.draw = function ()
  {
    updatePosition();
    ctx.strokeStyle = 'rgba(47, 47, 47, 0.3)';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
    //...
    window.requestAnimationFrame(L.draw);
  };
  return L;
})();
