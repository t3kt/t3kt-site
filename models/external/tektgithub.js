
var config = require("../../config/config"),
  Deferred = require("Deferred"),
  moment = require("moment"),
  E = require("../entities"),
  util = require("../util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  requestAsync = util.requestAsync;


exports.getRepoCommits = function(repoId)
{
  return requestAsync('https://api.github.com/repos/t3kt/'+repoId+'/commits')
    .pipe(function(body){
      var commits = JSON.parse(body);
      return commits.map(convertCommit);
    });
};

function convertCommit(obj)
{
  return E.commit({
    id: obj.sha,
    detailUrl: obj.html_url,
    posted: moment(obj.commit.committer.date),
    title: obj.commit.message
  });
}