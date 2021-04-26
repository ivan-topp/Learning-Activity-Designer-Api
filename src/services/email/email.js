const nodemailer = require('nodemailer');
require('dotenv').config();

const credentials = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER, 
        pass: process.env.MAIL_PASS  
    }
};

const transporter = nodemailer.createTransport(credentials);

transporter.verify().then(() => {
    console.log('Ready for send emails');
});

const sendEmail = async (to, content) => {
    const contacts = {
      from: `"Soporte - Learning Activity Designer" <${process.env.MAIL_USER}>`,
      to
    };
    const email = Object.assign({}, content, contacts);
    try {
        return await transporter.sendMail(email);
    } catch (error) {
        return false;
    }
}

module.exports = {
    sendEmail,
};