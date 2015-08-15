/**
 * (c) 2015 Jared Allard
 *
 * <insert MIT license here>
 *
 * @license MIT
 * @author Jared Allard <jaredallard@outlook.com>
 * @version 1.0.0
 **/

var prompt  = require('prompt'),
    fs      = require('fs'),
    request = require('request'),
    spin    = require('simple-spinner'),
    events  = require('./lib/events.js'),
    twit    = require('twit');

// temp?
function getCommit() {
  var commit = 'NOT-GIT';
  if(fs.existsSync('.git/refs/heads/master')) {
    commit = fs.readFileSync('.git/refs/heads/master', 'utf8').substr(1, 7);
  }

  return commit;
}

// version information
global.version = "0.1.0";
global.commit = getCommit();


// check the config files, if they don't exist start an interactive prompt.
// TODO: allow specification from the command line?
if(!fs.existsSync('./config.json')) {
  // use npm prompt to ask the user.
  prompt.start();

  var schema = {
    properties: {
      consumer_key: {
        required: true
      },
      consumer_secret: {
        required: true
      },
      access_token: {
        required: true
      },
      access_token_secret: {
        required: true
      }
    }
  };

  prompt.get(schema, function (err, result) {
    if(result.consumer_key === '') {
      throw 'consumer_key empty';
    } else if (result.consumer_secret === '') {
      throw 'consumer_secret empty';
    } else if(result.access_token === '') {
      throw 'access_token empty';
    } else if (result.access_token_secret === '') {
      throw 'access_token_secret empty';
    }

    // test our credentials
    process.stdout.write('testing credentials... ');

    // start the spinner
    spin.start(50, {
      hideCursor: true
    });

    // check if we're okay with twit.
    var T = new twit({
      consumer_key: result.consumer_key,
      consumer_secret: result.consumer_secret,
      access_token: result.access_token,
      access_token_secret: result.access_token_secret
    });

    T.get('account/verify_credentials', function(err, data, res) {
      if(err) {
        throw err;
      }

      if(data.screen_name === undefined) {
        throw 'data.screen_name undefined, bad credentials?';
      }

      // stop the spinner.
      spin.stop();

      var config = result; // should be already setup.

      // write it async-ly to our config file, then we can init.
      fs.writeFile('./config.json', JSON.stringify(config), 'utf8', function() {
        init(result.consumer_key, result.consumer_secret, result.access_token, result.access_token_secret);
      });
    });
  });
} else {
  var data = require('./config.json');
  if(data.access_token === '') {
    throw 'config.json is invalid. please delete it.'
  } else {
    init(data.consumer_key, data.consumer_secret, data.access_token, data.access_token_secret);
  }
}

// init the applications, for async.
function init(ck, cs, at, ats) {
  console.log("(c) 2015 Jared Allard");
  console.log("shinobot v:", global.version, "c:", global.commit);

  var T = new twit({
    consumer_key: ck,
    consumer_secret: cs,
    access_token: at,
    access_token_secret: ats
  });

  /*T.get('account/verify_credentials', function(err, data, res) {
    if(err) {
      throw err;
    }

    if(data.screen_name === undefined) {
      throw 'data.screen_name undefined, bad credentials?';
    }

    console.log('pre-init auth check succedded.')
    console.log("Hi! I'm", data.name+'.');

    events.init(T, data.screen_name);
    main(T, data.screen_name);
  });*/ // don't waste our api calls in development.

  // call the event init
  events.init(T, 'asadashinobot') // DEVELOPER ONLY
  main(T, 'asadashinobot'); // DEVELOPER ONLY
}

// main application.
function main(T, user) {
  // stream
  var stream = T.stream('user');

  stream.on('connect', events.connect);

  stream.on('connected', events.connected);

  stream.on('tweet', function(tweet) {

    /**
     * Reply to a tweet
     *
     * @param {string} text - status to send. Automatically adds username at front.
     * @return {boolean} true on success, false on failure.
     **/
    tweet.reply = function(text) {
        T.post('statuses/update', {
          status: '@'+tweet.user.screen_name+' '+text,
          in_reply_to_status_id: tweet.id
        }, function(err, data, res) {
          if(err) {
            console.log("I failed to send a reply with the error: ", err);
            return false;
          }

          return true;
        });
    }

    // check if it's @ us, and if it is that it's not a RT.
    if(tweet.text.match('@'+user) && (typeof(tweet.retweeted_status)==='undefined')) {
      events.mention(tweet); // call mention event.
    } else {
      events.tweet(tweet); // call tweet event.
    }
  });

  stream.on('favorite', events.favorite);

  stream.on('disconnect', events.disconnected);
}
