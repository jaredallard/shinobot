/**
 * Stores functions to be accessed by commands.json
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @license MIT
 * @version 0.1.0
 **/

'use strict';

const googleImages   = require('google-images'),
    base64           = require('node-base64-image');

let config;
try {
  config = require('../config.json');
} catch(err) {
  console.error('Failed to load config.');
  process.exit(1);
}

let cf = {};
let gi = googleImages(config.google.cseid, config.google.apikey);

function uploadImage(T, tweet) {
  let rn = Math.floor(Math.random() * 70);
  gi.search('Asada Shino',
  {
    page: rn
  })
  .then(function(imgs) {
    const options = {
      string: true
    }

    // get a random image in the returned object.
    let rn = Math.floor(Math.random() * imgs.length);
    base64.base64encoder(imgs[rn].url, options, function (err, image) {
      if (err) {
        console.error(err);
        return false;
      }

      T.post('media/upload', { media_data: image }, function (err, data, response) {
        if(err) {
          console.log(err);
          return false;
        }

        const params = {
          status: ' ',
          media_ids: [data.media_id_string],
        }

        T.post('statuses/update', params, function (err, data, response) {
          if(err) {
            console.log(err);
            return false;
          }
        });
      });
    });
  })
  .catch(function(err) {
    console.log('err', err);
  })
}

/**
 * example of a event functions
 *
 * @param {object} T - authenticated twit object
 * @return {boolean} success
 **/
cf.postImage = function(T) {
  uploadImage(T);
}

/**
 * Get the version / commit of the bot.
 *
 * @param {object} tweet - tweet object w/ .reply
 * @param {object} array - command object
 * @return {boolean} success
 **/
cf.getVersion = function(T, tweet, array) {
  var text = array.template({
    version: global.version,
    commit: global.commit
  });

  // reply with parsed data.
  tweet.reply(text);
  tweet.favorite();

  return true;
}

/**
 * Update the location to reflect our version
 *
 * @param {object} T - authenticated twit object
 **/
cf.updateLocation = function(T) {
  T.post('account/update_profile', {
    location: 'v'+global.version+"-"+global.commit,
    skip_status: true
  }, function(err, data, response) {
    if(err) {
      console.log(err);
      return false;
    }
  });
}

cf.printPublicTweets = function(T, tweet) {
  console.log(tweet.text);
}

/**
 * Get an image from the bot.
 *
 * @param {object} tweet - tweet object w/ .reply
 * @param {object} array - command object
 * @return {boolean} success
 **/
 cf.getImage = function(T, tweet, array) {
   uploadImage(T, tweet);
 }

module.exports = cf;
