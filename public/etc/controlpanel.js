var ControlPanel = (function (CP)
{
  function replaceTokens(str, tokens)
  {
    tokens = tokens || {};
    if (!str)
      return str;
    return str.replace(/%(\w+?)%/ig, function (m, key)
    {
      return tokens[key] != null ? tokens[key] : '';
    });
  }

  function encodeXml(str)
  {
    return attrEncode(str && str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  }

  function decodeXml(str)
  {
    return attrDecode(str).replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  }

  function attrEncode(str)
  {
    return (str && str.replace(/'/g, '&apos;').replace(/"/g, '&quot;')) || '';
  }

  function attrDecode(str)
  {
    return (str && str.replace(/&quot;/g, '"').replace(/&apos;/g, '\'')) || '';
  }

  var lastId = 0;

  function nextId()
  {
    return ++lastId;
  }

  function Control(def)
  {
    this.def = def || {};
    this.id = this.def.id || ('ctrl-' + nextId());
    this.name = this.def.name || this.id;
    //TODO
  }

  Control.prototype = {
    outerClass: '',
    render: function ()
    {
      var instanceId = this.id + '-' + nextId();
      return this.uiElement = $('<li class="ctrlpnl-control"/>')
        .attr('data-ctrlid', this.id)
        .addClass(this.outerClass || '')
        .data('ctrl', this)
        .append(this.renderLabel(instanceId))
        .append(this.uiField = this.renderField(instanceId));
    },
    renderLabel: function (instanceId)
    {
      return $('<label class="ctrlpnl-control-label"/>')
        .text(this.label || '')
        .attr('for', instanceId);
    },
    renderField: function (instanceId)
    {
      //TODO
    },
    getValue: function ()
    {
      return $(this.uiField).val();
    }
  };

  function TextControl(def)
  {
    Control.call(this, def);
  }

  TextControl.prototype = {
    renderField: function (instanceId)
    {
      return $('<input type="text"/>')
        .addClass('ctrlpnl-text-field')
        .attr('id', instanceId);
    }
  };

  CP.types = {
    text: TextControl
  };
  CP.defaultType = TextControl;

  CP.createControl = function (def)
  {
    var ctor = CP.types[def.type] || CP.defaultType;
    return new ctor(def);
  };

  function Panel(def)
  {
    this.def = def;
    var controls = this.controls = [];
    $.each(def.fields, function ()
    {
      var ctrl = CP.createControl(this);
      if (ctrl)
        controls.push(ctrl);
    });
  }

  Panel.prototype = {
    render: function ()
    {
      var pnl = this.uiPanel = $('<form class="ctrlpnl-panel"/>')
        .data('cpanel', this)
        .append(this.renderControls());
      return pnl;
    },
    renderControls: function ()
    {
      var list = $('<ul class="ctrlpnl-controls"/>');
      $.each(this.controls, function ()
      {
        list.append(this.render());
      });
      return list;
    },
    getValues: function ()
    {
      var vals = {};
      $.each(this.controls, function (i, ctrl)
      {
        vals[ctrl.name] = ctrl.getValue();
      });
      return vals;
    }
  };

  CP.renderControl = function (controlDef, list)
  {
    //TODO
  };

  CP.renderPanel = function (panelDef, area)
  {
    area = $(area);
    //TODO
  };

  return CP;
})(ControlPanel || {});
