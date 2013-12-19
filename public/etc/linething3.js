var LineThing3 = (function ()
{

  var util = {
    makeColor: function (rgb, alpha)
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
    },
    prepColor: function (opts)
    {
      if (!opts)
        return null;
      if ($.type(opts) == 'string')
        return {color: opts};
      if (opts.rgb && !opts.color)
        opts.color = util.makeColor(opts.rgb, opts.a);
      return opts;
    },
    mapRange: function (x, rangeIn, rangeOut)
    {
      return (x - rangeIn[0]) / (rangeIn[1] - rangeIn[0]) * (rangeOut[1] - rangeOut[0]) + rangeOut[0];
    }
  };

  var L = (function ()
  {
    function LineGradient(colors)
    {
      this.init(colors);
    }

    LineGradient.prototype = {
      colors: [],
      init: function (colors)
      {
        colors = colors || [];
        this.steps = colors.map(function (color, i)
        {
          return {
            offset: util.mapRange(i, [0, colors.length - 1], [0, 1]),
            color: util.prepColor(color)
          };
        });
      },
      makeGradient: function (ctx, pt1, pt2)
      {
        var gradient = ctx.createLinearGradient(0 | pt1.x, 0 | pt1.y, 0 | pt2.x, 0 | pt2.y);
        this.steps.forEach(function (step)
        {
          gradient.addColorStop(step.offset, step.color);
        });
        return gradient;
      }
    };

    function StateMachine(states)
    {
      this.states = {};
      if (Array.isArray(states))
        states.forEach(this.addState, this);
      else if (states)
        $.extend(this.states, states);
    }

    StateMachine.prototype = {
      addState: function (state)
      {
        this.states[state.id] = state;
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

    function State(id, update)
    {
      if ($.isPlainObject(id))
      {
        $.extend(this, id);
      }
      else
      {
        this.id = id;
        if (update)
          this._update = update;
      }
    }

    State.prototype = {
      _update: null,
      update: function (machine, params)
      {
        var next = this._update.apply(this, params);
        if (next)
          machine.goTo(next);
      }
    };

    function PathState(opts)
    {
      State.call(this, opts.id);
      this.init(opts);
    }

    PathState.prototype = new State({
      init: function (opts)
      {
        if (opts.start && opts.end)
        {
          this.start = opts.start;
          this.end = opts.end;
          this.range = [this.end[0] - this.start[0], this.end[1] - this.start[1]];
        }
        if (opts.next)
          this.next = opts.next;
      },
      _update: function (point, rate)
      {
        point.i += rate;
        if (point.i > 1)
        {
          point.x = this.end[0];
          point.y = this.end[1];
          point.i = 0;
          return  this.next;
        }
        point.x = this.start[0] + this.range[0] * point.i;
        point.y = this.start[1] + this.range[1] * point.i;
        return null;
      },
      drawControls: function (c, opts)
      {
        c.save();
        c.beginPath();
        c.lineWidth = opts.start.width;
        c.strokeStyle = opts.start.color;
        c.arc(start[0], start[1], opts.start.radius, 0, Math.PI * 2);
        c.stroke();
        c.lineWidth = opts.end.width;
        c.strokeStyle = opts.end.color;
        c.beginPath();
        c.arc(end[0], end[1], opts.end.radius, 0, Math.PI * 2);
        c.stroke();
        c.lineWidth = opts.line.width;
        c.strokeStyle = opts.end.color;
        c.beginPath();
        c.moveTo(start[0], start[1]);
        c.lineTo(end[0], end[1]);
        c.stroke();
        c.restore();
      }
    });

    function Point(states)
    {
      this.i = 0;
      this.x = 0;
      this.y = 0;
      this.stateMachine = new StateMachine(states);
    }

    Point.prototype = {
      setState: function (stateId)
      {
        this.stateMachine.goTo(stateId);
        this.i = 0;
      },
      updatePosition: function (rate)
      {
        this.stateMachine.update([this, rate]);
        return this;
      },
      drawLineTo: function (ctx, pt2, gradient)
      {
        ctx.save();
        ctx.strokeStyle = gradient.makeGradient(ctx, this, pt2);
        ctx.beginPath();
        ctx.moveTo(0 | this.x, 0 | this.y);
        ctx.lineTo(0 | pt2.x, 0 | pt2.y);
        ctx.stroke();
        ctx.restore();
        return this;
      }
    };

    return {
      LineGradient: LineGradient,
      StateMachine: StateMachine,
      State: State,
      PathState: PathState,
      Point: Point
    };
  })();

  L.Renderer = (function ()
  {
    function Renderer(canvas, opts)
    {
      this.canvas = canvas;
      this.width = canvas.width = opts.width;
      this.height = canvas.height = opts.height;
      this.bgColor = util.prepColor(opts.bgColor);
      if (this.bgColor && this.bgColor.color)
        this.canvas.style.backgroundColor = this.bgColor.color;
      this.ctx = canvas.getContext('2d');
      //TODO
    }

    Renderer.prototype = {
      fill: function (color)
      {
        if (color && color.color)
        {
          this.ctx.save();
          this.ctx.fillStyle = color.color;
          this.ctx.fillRect(0, 0, this.width, this.height);
          this.ctx.restore();
        }
        else
        {
          this.ctx.clearRect(0, 0, this.width, this.height);
        }
      }
    };

    return Renderer;
  })();

  L.system = (function ()
  {
    var settings = {
      width: 500,
      height: 500,
      bgColor: '#cccccc',
      lineGradientSteps: [
        {rgb: '2F2F2F', a: 0},
        {rgb: '2F2F2F', a: 0.3},
        {rgb: '2F2F2F', a: 0}
      ],
      controlsShown: false,
      controlDisplay: {
        start: {rgb: '00145A', a: 0.3, width: 2, radius: 10},
        end: {rgb: '005A14', a: 0.3, width: 2, radius: 5},
        line: {rgb: '005A5A', a: 0.3, width: 1}
      },
      rate: 0.005
    };

    var sys = {},
      width,
      height,
      bgColor,
      contentRenderer,
      controlRenderer,
      container,
      active = false,
      timerId,
      mouse = {x: 0, y: 0},
      paths = [
        new L.PathState({id: 'path1', next: 'path2'}),
        new L.PathState({id: 'path2', next: 'path3'}),
        new L.PathState({id: 'path3', next: 'path3'}),
        new L.PathState({id: 'path4', next: 'path1'})
      ],
      points = [
        new L.Point(paths),
        new L.Point(paths)
      ],
      lineGradient = new L.LineGradient([])

    function rescale(xy)
    {
      return [xy[0] * width, xy[1] * height];
    }

    sys.initialize = function (opts)
    {
      width = opts.width;
      height = opts.height;
      bgColor = util.prepColor(opts.bgColor);
      container = opts.container;
      contentRenderer = new L.Renderer({
        width: opts.width,
        height: opts.height,
        bgColor: opts.bgColor,
        canvas: opts.contentCanvas
      });
      controlRenderer = new L.Renderer({
        width: opts.width,
        height: opts.height,
        canvas: opts.controlCanvas
      });
      container.style.width = width + 'px';
      container.style.height = height + 'px';
      container.style.backgroundColor = bgColor.color;
      contentRenderer.ctx.save();
      contentRenderer.fill(bgColor);
      contentRenderer.ctx.restore();
      controlRenderer.fill(null);
    };

    sys.configure = function (opts)
    {
      if (opts.paths)
      {
        opts.paths.forEach(function (pathOpts, i)
        {
          paths[i].init({start: rescale(pathOpts.start), end: rescale(pathOpts.end), next: pathOpts.next});
        });
      }
      if (opts.rate)
        settings.rate = opts.rate;
      if (opts.controlsShown != null)
      {
        settings.controlsShown = opts.controlsShown;
        controlRenderer.canvas.style.display = opts.controlsShown ? 'block' : 'none';
        //TODO bind/unbind mouse handlers
      }
      if (opts.points)
      {
        opts.points.forEach(function (pointOpts, i)
        {
          var point = points[i];
          if (pointOpts.start)
            point.setState(points.start);
          point.disabled = pointOpts.disabled;
        });
      }
      //TODO
    };

    sys.update = function ()
    {
      //TODO
    };

    sys.draw = function ()
    {
      if (settings.controlsShown)
      {
        controlRenderer.clear();
        paths.forEach(function (path)
        {
          path.drawControls(controlRenderer.ctx, settings.controlDisplay);
        });
      }
      points.forEach(function (point)
      {
        if (point.disabled)
          return;
        point.drawLineTo(contentRenderer.ctx, mouse, lineGradient);
      });
    };

    sys.start = function ()
    {
      active = true;
      if (!timerId)
        timerId = requestAnimationFrame(sys.tick);
    };

    sys.stop = function ()
    {
      active = false;
      if (timerId)
      {
        cancelAnimationFrame(timerId);
        timerId = null;
      }
    };

    sys.tick = function ()
    {
      if (!active)
        return;
      sys.update();
      sys.draw();
      timerId = requestAnimationFrame(sys.tick);
    };

    //TODO

    return sys;
  })
    ();

})();

















