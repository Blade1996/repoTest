'use strict';

const AWS = require('aws-sdk');

function uploadFile(base64data, fileName, bucketName, contentType = 'application/pdf') {
	const configS3 = {
		accessKeyId: process.env.AWS_S3_ACCESS_KEY,
		secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
		params: {
			Bucket: process.env.AWS_S3_BUCKET,
			region: process.env.AWS_S3_REGION,
		},
		endpoint: process.env.AWS_S3_ENDPOINT,
	};
	if (bucketName === process.env.AWS_S3_BUCKET_SUNAT) {
		configS3.endpoint = process.env.AWS_S3_ENDPOINT_SUNAT;
		configS3.params.Bucket = process.env.AWS_S3_BUCKET_SUNAT;
	}
	const s3 = new AWS.S3(configS3);
	const fileContent = Buffer.from(base64data, 'base64');
	const parameters = {
		Key: `${bucketName}/${fileName}`,
		ContentEncoding: 'base64',
		ContentType: contentType,
		Body: fileContent,
		ACL: 'public-read',
	};
	const q = new Promise((resolve, reject) => {
		s3.upload(parameters, (err, data) => {
			if (err) {
				return reject(err);
			}
			return resolve(data);
		});
	});
	return q;
}

module.exports = uploadFile;
