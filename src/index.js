/**
 * shinobot - intelligent chat bot
 *
 * @author Jared Allard <jaredallard@outlook.com>
 * @license MIT
 * @version 2
 */
'use strict';

const debug = require('debug')('shinobot')
const Shino = require('shinojs')

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

const init = async () => {

  app = new Shino(require('./config.json'), ['telegram', 'twitter'])

  debug('init', 'init shino')
  await app.init()

  app.register('hello', (T, dm) => {
    dm.reply('Hello!')
  });

  app.register('debugEnabled', (T, dm) => {
    dm.reply('debug context set')
  })

  app.register('getContext', (T, dm, details) => {
    const context = details.getContext()
    dm.reply(`Current context is: ${context}`);
  })

  app.register('unknown', (T, dm) => {
    dm.reply('I\'m sorry, I don\'t understand that...')
  })

  app.register('dropContext', (T, dm, details) => {
    details.setContext('')
    dm.reply('Context is dropped. Root level instructions only.')
  })

  app.register('help', (adapater, msg) => {
    msg.reply(`
      I'm sorry... but I can't really do much right now. For now just try your best to find out my secrets~!
    `)
  })

  app.on('dm', {
    version: 2,
    address: 'hello',
    classifiers: [
      'hello',
      'hey',
      'hi'
    ],
    action: 'hello'
  })

  // Unknown command handler
  app.on('dm', {
    version: 2,
    address: 'unknown'
  })

  app.on('dm', {
    version: 2,
    address: 'start',
    classifiers: [
      'help',
      'how do i',
      'what can',
      'i need'
    ],
    action: 'help'
  })

  app.on('dm', {
    version: 2,
    address: 'debug',
    classifiers: [
      'debug mode',
      'set debug',
      'enable debug mode',
      'debug'
    ],
    default: 'unknown',
    action: 'debugEnabled',
    children: [
      {
        version: 2,
        classifiers: [
          'context',
          'get',
          'retrieve',
          'print',
          'show'
        ],
        action: 'getContext'
      },
      {
        version: 2,
        classifiers: [
          'context',
          'drop',
          'remove',
          'destroy'
        ],
        action: 'dropContext'
      }
    ]
  })

  app.done()
}


// Don't just get a "oh fuck a promise failed" message.
process.on('unhandledRejection', reason => {
  console.log('Unhandled Promise Rejection', reason)
});

// start the application
init()
