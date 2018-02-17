const nodemailer = require('nodemailer');
const pug = require('pug'); // template system
const juice = require('juice'); // converts css to inline in html
const htmlToText = require('html-to-text'); // converts html to plain taxt
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
  const inlined = juice(html);
  return inlined;
};

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);
  const mailOptions = {
    from: 'Adam Yagiz <noreply@adamyagiz.com>',
    to: options.user.email,
    subject: options.subject,
    html,
    text
  };
  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
};

// To test that it all works
// transport.sendMail({
//   from: 'Adam Yagiz <akyagiz@gmail.com>',
//   to: 'ruthswood@gmail.com',
//   subject: 'Learn Node with Wes Bos',
//   html: 'Hey, I <strong>LOVE</strong> you!',
//   text: 'Hey, I LOVE you.'
// });
