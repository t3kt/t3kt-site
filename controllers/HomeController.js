module.exports = {
  get_index: function(req, res)
  {
    res.render('index.jade', {
      currentContext: '/',
      title: 'home'
    });
  }
};