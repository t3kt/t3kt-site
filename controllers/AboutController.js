module.exports = {
  get_index: function(req, res)
  {
    res.render('about.jade', {
      currentContext: '/about',
      title: 'about'
    });
  }
};