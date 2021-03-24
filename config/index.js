import dotenv from 'dotenv';

dotenv.config();

const config = {
  mailOptions: {
    from: 'developer@websultanate.com',
    signup: {
      subject: 'Verify your Player LOUNGE account',
      text: 'Hello world',
      html: '<b>Hello world?</b>',
    },
  },
};

export default config;
