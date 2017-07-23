/**
 * Mail sender
 */

var nodemailer = require('nodemailer');

var doNotReply = nodemailer.createTransport({
	host: 'mail.glimpsable.com',
	ssl: true,
	port: 25,
	tls: { rejectUnauthorized: false },
	auth: {
		user: 'donotreply@glimpsable.com',
		pass: 'WB7bzUmUYYE3'
	}
});

module.exports.doNotReply = doNotReply;
