module.exports = {
  NOT_IMPLEMENTED: function (msg)
  {
    throw new Error("Not implemented: " + (msg || '') + "...");
  },
  Batcher: Batcher,
  batchItems: function(items, overrides) {
    return new Batcher(overrides).run(items);
  }
};

function Batcher(overrides)
{
  _.extend(this, overrides);
}

Batcher.prototype.startsNewBatch = function (item, batch)
{
  return !(batch != null) || batch.type === item.type;
};

Batcher.prototype.createBatch = function (item)
{
  return {
    type: item.type,
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