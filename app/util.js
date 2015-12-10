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
    return batch == null || batch.batchType !== item.entityType || batch.items.length > 3;
  },
  createBatch: function (item)
  {
    return {
      batchType: item.entityType,
      items: [item]
    };
  },
  addItem: function (item, batch)
  {
    return batch.items.push(item);
  },
  postProcessBatch: null
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
  if (!opts.postProcessBatch)
    return batches;
  return batches.map(opts.postProcessBatch);
}