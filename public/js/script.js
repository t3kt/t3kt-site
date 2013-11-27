var tekt = (function ()
{
  var T = {
    opts: null
  };

  T.initItemViewers = function (area)
  {
    var group = 'box-group-' + ($(area).attr('id') || 'main');
    $('figure.item-image a', area).colorbox({rel: group});
    //TODO...
  };

  T.initPage = function (pageId, o)
  {
    T.opts = o || {};
    T.pageId = pageId;
    switch (pageId)
    {
    }
    // TODO: ...
  };

  return T;
})();


if (window.$)
{
  $(function ()
  {
    var T = tekt;
    T.initItemViewers(window);

  });
}