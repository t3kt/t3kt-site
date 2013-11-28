var models = require('../models'),
  config = require('../../config/config'),
  request = require('request'),
  async = require('async'),
  url = require('url'),
  _ = require('lodash'),
  moment = require('moment'),
  parseLinkHeader = require('../linkheaders').parse,
  format = require('util').format;

var repoUrlFormat = 'https://api.github.com/repos/%s/commits?per_page=50';

function prepareCommit(key, extId, commit, project)
{
  return {
    entityType: models.Item.types.commit,
    key: key,
    project: [project.key],
    title: commit.commit.message,
    created: moment(commit.commit.committer.date).toDate(),
    updated: new Date(),
    external: {
      source: 'github',
      id: extId,
      url: commit.html_url,
      pulled: new Date(),
      data: commit
    }
  };
}

function getNextUrl(response)
{
  var header = response.headers['link'];
  var links = header && parseLinkHeader(header);
  if (!links)
    return;
  var link = links && _.where(links, {rel: 'next'})[0];
  return link && link.href;
}

function retrieveBatch(repoUrl, report, project, opts, next)
{
  opts.log('pulling commits: ', repoUrl);
  request(repoUrl, {headers: {'user-agent': 'tektcommitpull'}},
    function (err, response, body)
    {
      if (err)
        next(err);
      else if (response.statusCode != 200)
        next(new Error('Error getting commits from github [' + response.statusCode + ']: ' + body));
      else
      {
        var commits = JSON.parse(body);
        opts.log('found', commits.length, 'commits');
        async.eachSeries(commits,
          function (obj, nextCommit)
          {
            var extId = project.githubRepo.replace('/', ':') + obj.sha,
              key = 'commit:github:' + extId,
              commit = prepareCommit(key, extId, obj, project);
            models.getItem(key,
              function (err, storedCommit)
              {
                if (err)
                  nextCommit(err);
                else if (storedCommit)
                {
                  if (!opts.overwrite)
                  {
                    report.skipped++;
                    opts.log('skipping commit (key:', key, ')');
                    nextCommit();
                  }
                  else
                  {
                    storedCommit.update(commit, null,
                      function (err)
                      {
                        if (err)
                        {
                          opts.log('error updating commit (key:', key, '):', err);
                          nextCommit(err);
                        }
                        else
                        {
                          report.updated++;
                          opts.log('updated commit (key:', key, ')');
                          nextCommit();
                        }
                      })
                  }
                }
                else
                {
                  models.Item.create(commit,
                    function (err)
                    {
                      if (err)
                      {
                        opts.log('error adding commit (key:', key, '):', err);
                        nextCommit(err);
                      }
                      else
                      {
                        report.added++;
                        opts.log('added commit (key:', key, ')');
                        nextCommit();
                      }
                    })
                }
              }
            );
          },
          function (err)
          {
            if (err)
              next(err);
            else
            {
              var nextUrl = getNextUrl(response);
              if (!nextUrl)
                next();
              else
                retrieveBatch(nextUrl, report, project, opts, next);
            }
          });
      }
      ;
    });
}

function pullGithubCommitsForProject(project, opts, callback)
{
  if (!project.githubRepo)
  {
    opts.log('project does not have a githubRepoId');
    callback();
  }
  else
  {
    opts.log('Pulling from source github for project', project.key);

    var report = {
      added: 0,
      updated: 0,
      skipped: 0
    };

    retrieveBatch(format(repoUrlFormat, project.githubRepo),
      report, project, opts,
      function (err)
      {
        if (err)
        {
          opts.log('pull commits failed', err);
          callback(err);
        }
        else
        {
          opts.log('pull commits succeeded, added', report);
          callback(null, report);
        }
      });
  }
}

function pullGithubCommits(projects, opts, callback)
{
  async.eachSeries(projects,
    function (project, nextProject)
    {
      pullGithubCommitsForProject(project, opts, nextProject);
    },
    callback);
}

module.exports = pullGithubCommits;