/**
 * Handles events thrown by shinobot
 *
 * <insert MIT license here>
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @license MIT
 * @version 0.1.0
 **/

var spin = require('simple-spinner'),
    hb   = require('handlebars'),
    cf   = require('./command_functions.js'); // functions for commands

var events = {};
var cr = require('../commands.json')
var cmd = {} // populated later

/**
 * Executed on init of the client.
 *
 * @param {object} T - authenticated twit object
 * @param {string} user - same as tweet.user_name
 * @note This is not the same as index.init,
 **/
events.init = function(T, user) {
  process.stdout.write("pre-compiling tempalates ...");
  spin.start(50);
  cr.filter(function(v, i) {
    cmd[v.command] = {
      function: v.function,
      response: v.response,
      template: hb.compile(v.response)
    }
  });
  spin.stop();
  console.log("done")
}

/**
 * On a new tweet
 *
 * @param {object} tweet - parsed json object of a tweet.
 * @note This does not recieve mentions.
 **/
events.tweet = function(tweet) {
  // we ignore all tweets.
};

/**
 * On a new mention
 *
 * @param {object} tweet - parsed json object of a tweet.
 * @note This only recieves mentions
 **/
events.mention = function(tweet) {
  // parse commands.
  // [0]   = username
  // [1]   = (should be) command
  // [...] = paramaters...
  var cl = tweet.text.split(' '); // we use spaces as the split paramater

  // shorthand of parsed_cmd_array[command_line[1_command_param]]
  var clp = cmd[cl[1]];
  if(clp !== undefined) {
    if(clp.function !== undefined) {
      if(cf[clp.function] !== undefined) {
        cf[clp.function](tweet, clp); // call the command_function specified
      } else {
        console.log("error in "+cl[1]+" template, function not found.")
      }
    } else {
      tweet.reply(clp.response); // for templates that need no functions.
    }
  }
};

/**
 * Favorite event
 *
 * @param {object} favorite - favorite object
 **/
events.favorite = function(favorite) {
  // we ignore favorites.
}

/**
 * On Twitter connection event.
 *
 * @param {object} resq - connect request without http request object
 */
events.connect = function(req) {
  process.stdout.write("connecting to twitter ... ")
  global.ipc_spin = spin;
  global.ipc_spin.start(50);
}

/**
 * Connected event.
 *
 * @param {object} res - twitter response without http response object
 **/
events.connected = function(res) {
  global.ipc_spin.stop();
  console.log('connected.');
}

/**
 * Reconnect event.
 *
 * @param {object} request - http request object
 * @param {object} response - http response object
 * @param {number} connectInterval - interval between reconnect.
 * @see https://dev.twitter.com/docs/streaming-apis/connecting
 **/
events.reconnect = function(request, response, connectInterval) {
  console.log('reconnecting in '+connectInterval)
}


/**
 * On disconnect from the stream.
 *
 * @param {string} disconnectMessage - disconnect message/reason.
 */
events.disconnected = function(disconnectMessage) {
  console.log('We were disconnected from Twitter!');
  console.log('Reason: ', disconnectMessage);
};

module.exports = events;