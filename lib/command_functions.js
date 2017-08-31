/**
 * Stores functions to be accessed by commands.json
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @license MIT
 * @version 0.1.0
 **/

'use strict';

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
 * Get a random elment from an array.
 * @param  {Array}  array  array to get element from
 * @return {Promise}       returns random element
 */
const randomElement = async array => {
  const number = await random(0, array.length-1)
  return array[number]
}

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

  if(res.status !== 'success') throw new Error('Invalid response from pixiv.')

  const imgs = res.response

  // get a random image in the returned object.
  const image = await randomElement(imgs)

  debug('uploadImage', image)

  // hopefully gets high-res (TM)
  let image_url = image.image_urls.small.replace(/c\/\d+x\d+\//g, '')

  debug('uploadImage', 'from', image_url)

  const original_url       = `https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${image.id}`
  await T.tweet({
    status: `「${image.title}」${original_url}`,
    image: image_url,
    headers: {
      'Referer': original_url,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'
    }
  })
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
