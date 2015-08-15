/**
 * Stores functions to be accessed by commands.json
 *
 * <insert MIT license here>
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @license MIT
 * @version 0.1.0
 **/

var cf = {}

/**
 * Get the version / commit of the bot.
 *
 * @param {object} tweet - tweet object w/ .reply
 * @param {object} array - command object
 * @return {boolean} success
 **/
cf.getVersion = function(tweet, array) {
  var text = array.template({
    version: global.version,
    commit: global.commit
  });

  // reply with parsed data.
  tweet.reply(text);

  return true;
}

module.exports = cf;
