#!/bin/env node

'use strict'

// modules > native
const fs = require('fs')
const p = require('path')

// modules > 3rd party
const _ = require('lodash')
const rek = require('rek')
const program = require('commander')
const test = require('tape')

// modules > local
const transform = require('../transform')()
const TLDS = require('../tlds.json')

function list (input) {
  return input.split(',')
}

const pkg = require('../package.json')

/* TODO fix formatting totals (stream seems to end before tape outputs the
 * results, however tape outputs it correctly if you pipe straight to stdout
 * `test.createStream().pipe(process.stdout);` instead of
 * `test.createStream().pipe(transform).pipe(process.stdout);`
 * or
 * `test.createStream().pipe(require('tap-spec')()).pipe(process.stdout);`
 */
test.createStream().pipe(transform).pipe(process.stdout)

program
  .version(pkg.version)
  .usage('[options] <domains...>')
  .option('-c, --config <path>', 'Location of domainr configuration file', '~/.domainrrc')
  .option('-k, --key <value>', 'Mashape API Key for Domai.nr')
  .option('-t, --tlds <items>', 'Comma seperated list of top level domains', list)
  .option('-T <items>', 'Comma seperated list of top level domains', list)
  .option('-a, --all', 'Use ALL tLDs (overrides --tlds)')
  .parse(process.argv)

const config = JSON.parse(fs.readFileSync(p.join(process.env.HOME, '.domainrrc'), 'utf8'))

Object.assign(TLDS, config.tlds)

const tlds = program.tlds || []

program.key = program.key || config.key

let domains = []

if (program.T) {
  program.T.forEach((group) => {
    if (TLDS[group]) {
      tlds.push(...TLDS[group])
    }
  })
}

program.args.forEach((domain) => {
  if (domain.indexOf('.') > -1) {
    domains.push(domain)
  } else {
    domains = domains.concat(tlds.map((tld) => domain + '.' + tld))
  }
})

if (program.args.length === 0) {
  program.help()
  program.exit()
}

const headers = {
  'X-Mashape-Key': program.key,
  'Accept': 'application/json',
}

test('Domains', function (t) {
  const arrays = _.chunk(domains, 10)

  Promise.all(arrays.map((arr) => rek('https://domainr.p.mashape.com/v2/status?domain=' + arr.join(','), { headers })))
    .then((results) => {
      results = results.map((result) => result.status)
      results = [].concat(...results)

      results.sort((a, b) => {
        if (a.domain < b.domain) {
          return -1
        }
        if (a.domain > b.domain) {
          return 1
        }

        // names must be equal
        return 0
      }).forEach(function (status) {
        t.equal(status.summary, 'inactive', status.domain)
      })

      t.end()
    })
    .catch((err) => {
      console.error(err)
      // TODO decide what error code
      return process.exit(2)
    })
})
