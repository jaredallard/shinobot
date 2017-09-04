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

const init = async () => {

  let app = new Shino(require('./config.json'))

  debug('init', 'init shino')
  await app.init()

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

  app.on('dm', async content => {
    await content.reply('Sorry... I didn\'t understand you...')
  })

  app.done()
}


// Don't just get a "oh fuck a promise failed" message.
process.on('unhandledRejection', reason => {
  console.log('Unhandled Promise Rejection', reason)
});

// start the application
init()
