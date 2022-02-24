'use strict';

require('dotenv').config();

module.exports = {
	apps: [
		{
			name: 'dp6SalesPurchase',
			script: 'src/index.js',
			instances: 2,
			env_dev: {
				NODE_ENV: 'development',
				OFFSET_DEFAULT: 20,
			},
			env_production: {
				NODE_ENV: 'production',
			},
		},
	],
	deploy: {
		dev: {
			user: 'ubuntu',
			host: 'localhost',
			ref: 'origin/dev',
			repo: 'git@github.com:apprunn/dp6SalesPurchase.git',
			path: '/home/ubuntu/node/dp6SalesPurchase',
			'post-deploy':
				'npm install && npm run migrate && pm2 reload ecosystem.config.js --env dev',
			env: {
				NODE_ENV: 'development',
			},
		},
		production: {
			user: 'ubuntu',
			host: 'localhost',
			ref: 'origin/production',
			repo: 'git@github.com:apprunn/dp6SalesPurchase.git',
			path: '/home/ubuntu/node/dp6SalesPurchase',
			'post-deploy':
				'npm install --production && npm run migrate && pm2 reload ecosystem.config.js --env production',
			env: {
				NODE_ENV: 'production',
			},
		},
	},
};
