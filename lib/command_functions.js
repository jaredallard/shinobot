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
const randomNum      = require('random-number-csprng')
const Pixiv          = require('node-pixiv')

const cf    = {};
const pixiv = new Pixiv();

/**
 * Wrapper for randomNum, that allows min == max
 * @param  {Integer}  min   min number
 * @param  {Integer}  max   max number
 * @return {Promise}        YEA
 */
const random = async (min, max) => {
  if(min === max) return 0;
  return await randomNum(min, max)
}

/**
 * Get a image in base64, for Twitter
 * @param  {String} url       Image url
 * @param  {Object} headers   Headers to Include
 * @return {Promise}          Await it fam
 */
const getImageForTwitter = async (url, headers = {}) => {
  const image_download_raw = await request({
    uri: url,
    encoding: null,
    headers: headers
  })
  const image_base64 = image_download_raw.toString('base64')
  return image_base64
}

/**
 * Post an Image w/ Text to Twitter.
 * @param  {Object}  T       Twit Object
 * @param  {Object}  options Options, with status, and image (base64)
 * @return {Promise}         Yknow the dril.
 */
const postImageToTwitter = async (T, options) => {
  const status       = options.status
  const image_base64 = options.image
  const params       = {
    in_reply_to_status_id: options.in_reply_to_status_id || null,
    status: status
  }

  // upload image to Twitter.
  const res  = await T.post('media/upload', { media_data: image_base64 })
  const data = res.data
  debug('uploadImage', data)
  params.media_ids = [data.media_id_string]

  // post new status with image.
  await T.post('statuses/update', params)

  return
}

/**
 * Upload an image.
 * @param  {Object} T     Twit object.
 * @return {undefined}
 */
const uploadImage = async T => {
  const max_pages = config.pixiv.max_pages;

  let rn = await random(0, max_pages-1);
  config.pixiv.page = rn;

  debug('uploadImage', `random page is '${rn}/${max_pages}'`)
  await pixiv.login(config.pixiv.login)
  const res = await pixiv.search(config.pixiv.search)

  if(res.status !== 'success') throw new Error('Invalid response from pixiv.')

  const imgs = res.response

  // get a random image in the returned object.
  rn               = await random(0, res.count-1);
  const image      = imgs[rn]

  // hopefully gets high-res (TM)
  let image_url = image.image_urls.small.replace(/c\/\d+x\d+\//g, '')

  debug('uploadImage', `random image is '${rn}/${imgs.length}'`)
  debug('uploadImage', 'from', image_url)

  const original_url       = `https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${image.id}`
  const image_base64       = await getImageForTwitter(image_url, {
    'Referer': original_url,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'
  })

  debug('uploadImage', 'uploading image to twitter')
  await postImageToTwitter(T, {
    status: `「${image.title}」${original_url}`,
    image: image_base64
  })
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
cf.getVersion = async (T, tweet, array) => {
  const text = array.template({
    version: global.version,
    commit: global.commit
  });

  // reply with parsed data.
  await tweet.reply(text);
  await tweet.favorite();

  return true;
}

cf.denyImage = async (T, tweet) => {
  const responses = [
    'ごめんなさい... I only post images sometimes! Maybe later~',
    'Oops! I can\'t send you an image right now... Maybe checkout https://pixiv.net?',
    'Hmm... you\'ll have to wait for me to find another cute picture!'
  ]

  const rn = await random(0, responses.length-1)
  const response = responses[rn]

  debug('denyImage', 'denying image post...', rn)
  await tweet.reply(response)
}

/**
 * She 'denys' or loves you!
 * @param  {Object}  T     Twit
 * @param  {Object}  tweet Twit Object
 * @return {Promise}       await it
 */
cf.love = async (T, tweet) => {
  const responses = [
    '.... Fine. I love you too~',
    '私もあなたを愛してます ...',
    'O-oh! This is unexpected....',
    {
      text: 'W-what!? .... I\'m still going to kill you!',
      image: 'https://static.tumblr.com/916384e464d8816243210c1e6f94112f/khvpum5/tBMohl5p1/tumblr_static_tumblr_static_4y4fr6j1g1cs08k40o4c4ksk_640.gif'
    }
  ]

  const rn       = await random(0, responses.length-1)
  const response = responses[rn]
  debug('love', 'love post!!', rn)

  await tweet.reply(response)
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
