#!/bin/env node

// modules > native
import fs from 'fs'
import p from 'path'

// modules > 3rd party
import _ from 'lodash'
import rek from 'rek'
import program from 'commander'
import test from 'tape'

// modules > local
import Transform from '../transform.js'
import TLDS from '../tlds.json' assert { type: 'json' }
import pkg from '../package.json' assert { type: 'json' }

const transform = Transform()

function list (input) {
  return input.split(',')
}


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
const key = program.key || config.key

if (!key) {
  console.error('An API key is required!')
  process.exit(2)
}

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
  'x-rapidapi-host': 'domainr.p.rapidapi.com',
  'x-rapidapi-key': key,
}

test('Domains', function (t) {
  const arrays = _.chunk(domains, 10)

  Promise.all(arrays.map((arr) => rek('https://domainr.p.rapidapi.com/v2/status?domain=' + arr.join(','), { headers }).json()))
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
