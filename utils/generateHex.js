import crypto from 'crypto';

const generateHex = (email) => {
  const hash = crypto.createHmac('sha256', 'verificationHash').update(email).digest('hex');
  return hash;
};
export default generateHex;
