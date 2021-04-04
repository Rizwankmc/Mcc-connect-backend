import sgMail from '@sendgrid/mail';
import config from '../config/index.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (html) => {
  try {
    await sgMail.send(html);
    return true;
  } catch (e) {
    console.error('Mail Service Error => ', e);
    return false;
  }
};

export default sendEmail;
