
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


$(function(){
  $('.image-grid-link').fancybox();
});