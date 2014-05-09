var natural = require('natural'),
  Dictionary = require('mw-dictionary'),
  _ = require('lodash'),
  async = require('async'),
  config = require('../../config/config'),
  dict = new Dictionary({key: config.dictionaryApiKey}),
  NOT_IMPLEMENTED = require('../../app/util').NOT_IMPLEMENTED;

function NetworkBuilder(opts)
{
  opts = _.merge({
    maxDistance: 4,
    maxTotal: 20
  }, opts);

  var stemmer = opts.stemmer || natural.LancasterStemmer,
    tokenizer = opts.tokenizer || new natural.AggressiveTokenizer();

  var builder = {
    wordCount: 0,
    nodesByStem: {}
  };
  builder.cleanWord = function (word, callback)
  {
    if (!word)
      callback();
    else
      callback(null, stemmer.stem(word));
  };
  builder.addWord = function (word, callback)
  {
    builder.cleanWord(word,
      function (err, stem)
      {
        if (err)
        {
          callback(err);
        }
        else if (!stem)
        {
          callback();
        }
        else
        {
          var node = builder.nodesByStem[stem];
          if (node)
          {
            node.refCount++;
            if (node.words.indexOf(word.toLowerCase()) == -1)
              node.words.push(word.toLowerCase());
            callback(null, node);
          }
          else
          {
            node = new WordNode(stem, word);
            builder.nodesByStem[stem] = node;
            builder.wordCount++;
            dict.define(word,
              function (err, definition)
              {
                if (err)
                  callback(err);
                else if (!definition || !definition.length)
                {
                  callback(null, node);
                }
                else
                {
                  var defWords = _.uniq(tokenizer.tokenize(definition[0].definition));
                  node.definitionStems = _(defWords).map(function (w)
                  {
                    return stemmer.stem(w);
                  }).uniq();
                  async.eachSeries(defWords,
                    function (w, next)
                    {
                      builder.addWord(w, next);
                    },
                    function (err)
                    {
                      if (err)
                        callback(err);
                      else
                        callback(null, node);
                    })
                }
              });
          }
        }
      });
  };
  builder.dump = function ()
  {
    console.log('Word Network (count: ' + builder.wordCount + ')');
    Object.keys(builder.nodesByStem).forEach(function (s)
    {
      console.log('  ' + builder.nodesByStem[s]);
    });
  };

  //TODO
  return builder;
}

module.exports.NetworkBuilder = NetworkBuilder;

function WordNode(stem, word)
{
  this.stem = stem;
  this.words = [ word.toLowerCase() ];
  this.definition = '';
  this.definitionStems = [];
  this.refCount = 0;
}
WordNode.prototype.toString = function ()
{
  return 'NODE( stem: ' + this.stem + ' ) word(s): [ ' + this.words.join(', ') + ' ], def: [ ' + this.definitionStems.join(', ') + ' ], refs: ' + this.refCount;
};




