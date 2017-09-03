/**
 * shinobot - regex powered node.js chat bot
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

  // on all dms
  app.on('dm', (dm, next) => {
    debug('test', 'got DM')

    return next()
  }, (dm, next) => {
    debug('test', 'yay i can go too')
    return next()
  });

  app.on('dm', {
    version: 1,
    classifiers: [
      'hello',
      'hi'
    ]
  }, content => {
    debug('nlp:test', content.analysis)
  })
}


// Don't just get a "oh fuck a promise failed" message.
process.on('unhandledRejection', reason => {
  console.log('Unhandled Promise Rejection', reason)
});

// start the application
init()
