#!/bin/env node

'use strict';

// modules > native
const fs = require('fs');

//modules > 3rd party
const transform = require('../transform')();
const request = require('superagent');
const program = require('commander');
const test = require('tape');

function list(input) {
  return input.split(',');
}

const pkg = require('../package.json');

/* TODO fix formatting totals (stream seems to end before tape outputs the
 * results, however tape outputs it correctly if you pipe straight to stdout
 * `test.createStream().pipe(process.stdout);` instead of
 * `test.createStream().pipe(transform).pipe(process.stdout);`
 * or
 * `test.createStream().pipe(require('tap-spec')()).pipe(process.stdout);`
 */
test.createStream().pipe(transform).pipe(process.stdout);

program
  .version(pkg.version)
  .usage('[options] <domains...>')
  .option('-c, --config <path>', 'Location of domainr configuration file', '~/.domainrrc')
  .option('-k, --key <value>', 'Mashape API Key for Domai.nr')
  .option('-t, --tlds <items>', 'Comma seperated list of top level domains', list)
  .option('-a, --all', 'Use ALL tLDs (overrides --tlds)')
  .parse(process.argv);

const config = JSON.parse(fs.readFileSync('/home/sup3rman/.domainrrc', 'utf8'));

program.key = program.key || config.key;
program.tlds = program.tlds || config.tlds;

if (program.args.length === 0) {
  program.help();
  program.exit();
}

let domains = [];

program.args.forEach((domain) => {
  if (domain.indexOf('.') > -1)
    domains.push(domain);
  else
    domains = domains.concat(program.tlds.map((tld) => domain + '.' + tld));
});

domains.sort();

test('Domains', function (t) {
  request.get('https://domainr.p.mashape.com/v2/status?domain=' + domains.join(','))
    .set('X-Mashape-Key', program.key)
    .set('Accept', 'application/json')
    .end((err, res) => {
      if (err) {
        console.error(err);
        // TODO decide what error code
        return process.exit(2);
      }

      res.body.status.forEach(function (status) {
        t.equal(status.summary, 'inactive', status.domain);
      });

      t.end();
    });
});
