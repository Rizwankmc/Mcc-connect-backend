import sgMail from '@sendgrid/mail';
import config from '../config/index.js';

sgMail.setApiKey('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');

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
