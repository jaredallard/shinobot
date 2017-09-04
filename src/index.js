/**
 * shinobot - intelligent chat bot
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @license MIT
 * @version 2
 */
'use strict';

const debug = require('debug')('shinobot')
const Shino = require('../../shinojs/lib/shino.js')

let app;

/**
 * Wait for x time
 * @param  {Number} [int=5000] [description]
 * @return {Promise}           .then on finish
 */
const wait  = (int = 1300) => {
  return new Promise(resolv => {
    setTimeout(resolv, int)
  })
}

const users = {

}

const processRegistration = async dm => {
  const userid = dm.sender.id_str

  const response = app.classifier.classify(dm.text)

  if(response === 'no') {
    await dm.reply('Sorry... I need your permisson to continue. Message me again anytime to start again!')
    return delete users[userid]
  }

  users[userid] = dm.sender

  return await dm.reply('Great! You\'re all set!')
}

const init = async () => {

  app = new Shino(require('./config.json'))

  debug('init', 'init shino')
  await app.init()

  // account registration
  app.on('dm', async (dm, next) => {
    const userid = dm.sender.id_str

    // registration phase
    if(users[userid] === 'registering') return await processRegistration(dm)
    if(users[userid]) return next()

    await dm.reply(`Hello, {{screen_name}}! I'm Asada Shino. It's nice to meet you!`)
    await wait()

    await dm.reply('My goal is to become a fully functioning AI one day!')
    await wait()

    await dm.reply(`But before we get into that, I'm going to need your permission to create you an account! Is that OK?`)

    // set stage
    users[userid] = 'registering'
  })

  app.on('dm', {
    version: 1,
    label: 'hello',
    classifiers: [
      'hello',
      'hi',
      'hey',
      'suh'
    ]
  }, async content => {
    debug('hello', content.analysis)
    await content.reply('Hello!')
  })

  app.on('dm', {
    version: 1,
    label: 'goodbye',
    classifiers: [
      'goodbye',
      'seeya',
      'bye'
    ]
  }, async content => {
    debug('goodbye', content.analysis)
    await content.reply('Goodbye~')
  })

  app.on('dm', {
    version: 1,
    label: 'stateInquiry',
    classifiers: [
      'how are you',
      'how are you feeling'
    ]
  }, async content => {
    await content.reply('I\'m doing good! How are you?')
  })

  app.on('dm', {
    version: 1,
    label: 'stateResponse',
    classifiers: [
      'im qqqq',
      'not qqqq',
      'ok',
      'fine'
    ]
  })

  app.on('dm', async content => {
    await content.reply('Sorry... I didn\'t understand you...')
  })

  // custom responses
  const yes = [
    'yes',
    'ye',
    'yeah',
    'yea',
    'sure',
    'thats cool',
    'yep'
  ]
  const no = [
    'no',
    'nah',
    'nope',
    'no thanks',
    'never'
  ]

  yes.forEach(trainee => {
    app.classifier.addDocument(trainee, 'yes')
  })

  no.forEach(trainee => {
    app.classifier.addDocument(trainee, 'no')
  })

  app.done()
}


// Don't just get a "oh fuck a promise failed" message.
process.on('unhandledRejection', reason => {
  console.log('Unhandled Promise Rejection', reason)
});

// start the application
init()
