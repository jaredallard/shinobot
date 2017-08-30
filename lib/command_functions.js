/**
 * Stores functions to be accessed by commands.json
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @license MIT
 * @version 0.1.0
 **/

'use strict';

const request        = require('request-promise-native')
const config         = require('../config.json')
const debug          = require('debug')('shinobot')
const random         = require('random-number-csprng')
const Pixiv          = require('node-pixiv')

const cf    = {};
const pixiv = new Pixiv();

/**
 * Upload an image.
 * @param  {Object} T     Twit object.
 * @return {undefined}
 */
const uploadImage = async T => {
  const max_pages = config.pixiv.max_pages;

  let rn = await random(0, max_pages);
  config.pixiv.page = rn;

  debug('uploadImage', `random page is '${rn}/${max_pages}'`)

  await pixiv.login(config.pixiv.login)
  const res = await pixiv.search(config.pixiv.search)

  if(res.status !== 'success') throw new Error(`Invalid response from pixiv: ${res.status}.`)

  const imgs = res.response

  debug('uploadImage', imgs)

  // get a random image in the returned object.
  rn               = await random(0, res.count);
  const image      = imgs[rn]

  // hopefully gets high-res (TM)
  let image_url = image.image_urls.small
  image_url        = image_url.replace(/c\/\d+x\d+\//g, '')

  debug('uploadImage', `random image is '${rn}/${imgs.length}'`)
  debug('uploadImage', image)
  debug('uploadImage', 'from', image_url)

  const original_url       = `https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${image.id}`
  const image_download_raw = await request({
    uri: image_url,
    encoding: null,
    headers: {
      'Referer': original_url,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'
    }
  })
  const image_base64 = image_download_raw.toString('base64')

  debug('uploadImage', 'uploading image to twitter')
  const params = {
    status: `「${image.title}」${image.user.name} ${original_url}`
  }

  // upload image
  try {
    const res  = await T.post('media/upload', { media_data: image_base64 })
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
