var _ = require('lodash');

module.exports = exports = {
  NOT_IMPLEMENTED: function (msg)
  {
    throw new Error("Not implemented: " + (msg || '') + "...");
  },
  asArray: function (val)
  {
    if (!(val != null))
    {
      return [];
    }
    else
    {
      if (Array.isArray(val))
      {
        return val;
      }
      else
      {
        return [val];
      }
    }
  },
  batchItems: function (items, overrides)
  {
    return batchItems(items, overrides);
  }
};

var batchItemDefaults = {
  startsNewBatch: function (item, batch)
  {
    return batch == null || batch.type !== item.entityType;
  },
  createBatch: function (item)
  {
    return {
      type: item.entityType,
      items: [item]
    };
  },
  addItem: function (item, batch)
  {
    return batch.items.push(item);
  },
  run: function (items)
  {
    var batch, batches, item, _i, _len;
    batches = [];
    batch = null;
    if (!items)
      return batches;
    for (_i = 0, _len = items.length; _i < _len; _i++)
    {
      item = items[_i];
      if (this.startsNewBatch(item, batch))
      {
        batches.push(batch = this.createBatch(item));
      }
      else
      {
        this.addItem(item, batch);
      }
    }
    return batches;
  }
};
function batchItems(items, opts)
{
  opts = _.assign({}, batchItemDefaults, opts);
  var batches = [],
    batch,
    item;
  if (!items)
    return batches;
  for (var i = 0, len = items.length; i < len; i++)
  {
    item = items[i];
    if (opts.startsNewBatch(item, batch))
      batches.push(batch = opts.createBatch(item));
    else
      opts.addItem(item, batch);
  }
  return batches;
}