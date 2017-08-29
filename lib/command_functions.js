/**
 * Stores functions to be accessed by commands.json
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @license MIT
 * @version 0.1.0
 **/

'use strict';

const googleImages   = require('google-images')
const base64         = require('node-base64-image');
const config         = require('../config.json')
const debug          = require('debug')('shinobot')
const random         = require('random-number-csprng')

const cf = {};
const gi = new googleImages(config.google.cseid, config.google.apikey);

/**
 * Upload an image.
 * @param  {Object} T     Twit object.
 * @return {undefined}
 */
const uploadImage = async T => {
  let rn = await random(0, config.google.max_pages);

  debug('uploadImage', `random page is '${rn}/${config.google.max_pages}'`)

  const options = {
    string: true
  }

  const imgs = await gi.search(config.google.search, {
    page: rn
  })

  // get a random image in the returned object.
  rn = await random(0, imgs.length);
  const image = imgs[rn]

  debug('uploadImage', `random image is '${rn}/${imgs.length}'`)

  debug('uploadImage', image)

  base64.encode(image.url, options, async (err, image) => {
    if(err) return console.log(err)

    // upload the image.
    debug('uploadImage', 'uploading image to twitter')
    const params = {
      status: ' '
    }

    // upload image
    try {
      const res  = await T.post('media/upload', { media_data: image })
      const data = res.data
      debug('uploadImage', data)
      params.media_ids = [data.media_id_string]
    } catch(e) {
      return debug('uploadImage', 'failed to upload media to Twitter.')
    }

    debug('uploadImage', 'media ids', params.media_ids)

    // post new status with image.
    try {
      await T.post('statuses/update', params)
    } catch(e) {
      debug('uploadImage', 'failed to post status to Twitter.')
    }

    debug('uploadImage', 'uploaded to twitter')
  });
}

/**
 * example of a event functions
 *
 * @param {object} T - authenticated twit object
 * @return {boolean} success
 **/
cf.postImage = async T => {
  await uploadImage(T);
}

/**
 * Get the version / commit of the bot.
 *
 * @param {object} T - authenticated twit object
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
 * @returns {Promise} T.post
 **/
cf.updateLocation = T => {
  console.log('updating location')
  return T.post('account/update_profile', {
    location: `v${global.version}-${global.commit}`,
    skip_status: true
  })
}

cf.printPublicTweets = function(T, tweet) {
  console.log(tweet.text);
}

/**
 * Get an image from the bot.
 *
 * @param {object} T - authenticated twit object
 * @return {boolean} success
 **/
 cf.getImage = T => {
   return uploadImage(T);
 }

 // Don't just get a "oh fuck a promise failed" message.
 process.on('unhandledRejection', reason => {
   console.log('Unhandled Promise Rejection', reason)
 });

module.exports = cf;
