'use strict'

// cannot remember if i made this myself or copied it from somewhere
const tapOut = require('tap-out')
const through = require('through2')
const duplexer = require('duplexer')
const format = require('chalk')
const prettyMs = require('pretty-ms')
const _ = require('lodash')
const symbols = require('figures')

module.exports = function (spec) {
  spec = spec || {}

  const OUTPUT_PADDING = spec.padding || '  '

  const output = through()
  const parser = tapOut()
  const stream = duplexer(parser, output)
  const startTime = new Date().getTime()

  output.push('\n')

  parser.on('test', function (test) {
    output.push('\n' + pad(format.underline(test.name)) + '\n\n')
  })

  // Passing assertions
  parser.on('pass', function (assertion) {
    const glyph = format.green(symbols.tick)
    const name = format.dim(assertion.name)

    output.push(pad('  ' + glyph + ' ' + name + '\n'))
  })

  // Failing assertions
  parser.on('fail', function (assertion) {
    const glyph = symbols.cross
    const title = glyph + ' ' + assertion.name

    output.push(pad('  ' + format.red(title) + '\n'))
    stream.failed = true
  })

  parser.on('comment', function (comment) {
    output.push(pad('  ' + format.yellow(comment.raw)) + '\n')
  })

  // All done
  parser.on('output', function (results) {
    console.log('all done')
    output.push('\n\n')

    output.push(formatTotals(results))
    output.push('\n\n\n')

    // Exit if no tests run. This is a result of 1 of 2 things:
    //  1. No tests were written
    //  2. There was some error before the TAP got to the parser
    if (results.tests.length === 0) {
      process.exit(1)
    }
  })

  // Utils
  function formatTotals (results) {
    if (results.tests.length === 0) {
      return pad(format.red(symbols.cross + ' No tests found'))
    }

    return _.filter([
      pad('total:     ' + results.asserts.length),
      pad(format.green('passing:   ' + results.pass.length)),
      results.fail.length > 0 ? pad(format.red('failing:   ' + results.fail.length)) : undefined,
      pad('duration:  ' + prettyMs(new Date().getTime() - startTime)),
    ], _.identity).join('\n')
  }

  function pad (str) {
    return OUTPUT_PADDING + str
  }

  return stream
}
