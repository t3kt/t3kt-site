var Dictionary = require('mw-dictionary'),
  config = require('../config/config'),
  dict = new Dictionary({key: config.dictionaryApiKey}),
  natural = require('natural');


function defineWord(word, callback)
{
  dict.define('wombat', function (err, definition)
  {
    if (err)
    {
      console.log('ERROR', err);
      callback(err);
    }
    else
    {
      console.log('DEFINITION', word, definition);
      callback(null, definition);
    }
  })
}

function tokenizeAndStem(text, callback)
{
  var stemmer = natural.LancasterStemmer;
  var stems = stemmer.tokenizeAndStem(text);
  console.log('STEMS', text, stems);
  callback(null, stems);
}

function defineAndTokenize(word)
{
  defineWord(word,
    function (err, definition)
    {
      if (definition)
      {
        tokenizeAndStem(definition[0].definition, function ()
        {
        });
      }
    })
}

defineAndTokenize('wombat');