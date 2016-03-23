#!/bin/env node

'use strict';

const request = require('superagent');

const args = process.argv.slice(2);

if (args.length < 2) {
	console.log('USAGE: domai.nr MASHAPE_KEY domain [tLDs]');

	// TODO decide what error code
	process.exit(2);
}

let domains;

if (args.length === 2)
	domains = args[1];
else
	domains = args[2].split(',').map((tl) => args[1] + '.' + tl).join(',');

request.get('https://domainr.p.mashape.com/v2/status?domain=' + domains)
	.set('X-Mashape-Key', args[0])
	.set('Accept', 'application/json')
	.end((err, res) => {
		if (err) {
			console.error(err);
			// TODO decide what error code
			return process.exit(2);
		}

		console.log(res.body);

		return process.exit(0);
	});
