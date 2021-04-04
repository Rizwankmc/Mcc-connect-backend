import dotenv from 'dotenv';

dotenv.config();

const config = {
  mailOptions: {
    from: 'mcc.dev-connect@gmail.com',
    signup: {
      subject: 'Verify your Player LOUNGE account',
      text: 'Hello world',
      html: '<b>Hello world?</b>',
    },
  },
};

export default config;
