'use strict';

const AWS = require('aws-sdk');

AWS.config.update({
	accessKeyId: process.env.AWS_SQS_ACCESS_KEY,
	region: process.env.AWS_REGION,
	secretAccessKey: process.env.AWS_SQS_SECRET_KEY,
});

const sqs = new AWS.SQS();

function sendMessage(payload, type, MessageDeduplicationId, url = process.env.SQS_PRODUCTS_URL) {
	const MessageBody = JSON.stringify({ type, payload });
	const params = {
		MessageDeduplicationId,
		MessageGroupId: type,
		MessageBody,
		QueueUrl: url,
	};

	sqs.sendMessage(params, (err) => {
		if (err) {
			throw new Error(err);
		}
	});
}

module.exports = sendMessage;
