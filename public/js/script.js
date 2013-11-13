
var tekt = (function()
{
  function initProjectDetails(opts)
  {
    var projectId = opts.projectId;
  }
  return {
    opts:null,
    init: function(pageId, o)
    {
      this.opts = o || {};
      switch(pageId)
      {
        case 'projectDetail':
          initProjectDetails(o);
          break;
      }
      // TODO: ...
    }
  };
})();


if(window.$)
{
  $(function()
  {
    if($.fn.fancybox)
      $('.image-grid-link').fancybox();
  });
}