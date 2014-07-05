var tekt = (function ()
{
  var T = {
    opts: null
  };

  var pageInitializers = {
    projectDetail: function (o)
    {
      $('#project-items').load('/projects/' + o.projectKey + '/itembatches?ajax=1', function ()
      {
        tekt.initItemViewers('#project-items');
      });
    }
  };

  T.initItemViewers = function (area)
  {
    if ($.fn.colorbox)
    {
      $('.item-image a', area).colorbox({rel: 'box-group-' + ($(area).attr('id') || 'main')});
    }

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
    if (!pageId)
    {
      pageId = $('main').data('routeid');
      o = $('main').data('page-params')
    }
    T.opts = o = o || {};
    T.pageId = pageId;
    T.initItemViewers(window);
    $(window)
      .unbind('scroll.updatestate')
      .bind('scroll.updatestate', function ()
      {
        $(document.body).toggleClass('scrolled-down', (document.body.scrollTop || document.documentElement.scrollTop) > 5);
      })
      .triggerHandler('scroll.updatestate');
    $('#site-menu-toggle').click(function ()
    {
      $('#main-nav').toggleClass('toggled-open');
      return false;
    });
    var init = pageInitializers[pageId];
    if (init)
      init(o);
  };

  return T;
})();


if (window.$)
{
  $(function ()
  {
    tekt.initPage();
  });
}