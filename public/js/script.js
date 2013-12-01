var tekt = (function ()
{
  var T = {
    opts: null
  };

  T.initItemViewers = function (area)
  {
    var group = 'box-group-' + ($(area).attr('id') || 'main');
    $('figure.item-image a', area).colorbox({rel: group});

    $(area).off('click.loadvideo')
      .on('click.loadvideo', '.load-video', function ()
      {
        var vidId = $(this).closest('[data-key]').attr('data-key');
        if (vidId)
        {
          $(this).parent().load('/video/' + vidId + '/embed', function ()
          {
            $(this).closest('.item-video').addClass('video-loaded');
          });
          return false;
        }
      });
    //TODO...
  };

  T.initPage = function (pageId, o)
  {
    T.opts = o || {};
    T.pageId = pageId;
    switch (pageId)
    {
      case 'projectDetail':

        $('#project-items').load('/projects/' + o.projectKey + '/itembatches?ajax=1 #ajax-main > *', function ()
        {
          tekt.initItemViewers('#project-items');
        });
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
    $(window)
      .bind('scroll', function ()
      {
        $(document.body).toggleClass('scrolled-down', (document.body.scrollTop || document.documentElement.scrollTop) > 5);
      })
      .trigger('scroll');
  });
}