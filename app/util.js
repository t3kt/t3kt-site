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
  Batcher: Batcher,
  batchItems: function (items, overrides)
  {
    return new Batcher(overrides).run(items);
  }
};

function Batcher(overrides)
{
  _.extend(this, overrides);
}

Batcher.prototype.startsNewBatch = function (item, batch)
{
  return batch == null || batch.type !== item.entityType;
};

Batcher.prototype.createBatch = function (item)
{
  return {
    type: item.entityType,
    items: [item]
  };
};

Batcher.prototype.addItem = function (item, batch)
{
  return batch.items.push(item);
};

Batcher.prototype.run = function (items)
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
};


var batchItemDefaults = {
  startsNewBatch:function(item, batch)
  {
    return !(batch != null) || batch.type !== item.entityType;
  }
}
function batchItems(items, opts)
{

}