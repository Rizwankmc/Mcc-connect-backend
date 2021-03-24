import config from '../config/index.js';
export const signupHTML = (to, name, otp) => {
    return{
        from: config.mailOptions.from, // sender address Change to your verified sender
        templateId: process.env.VERIFY_TEMPLATE,
        personalizations: [
          {
            to: [
              {
                email: to,
              },
            ],
            dynamic_template_data: {
              otp,
              name
            },
          },
        ],
    }
}
export const forgetHTML = (to, name, otp) => {
    return{
        from: config.mailOptions.from, // sender address Change to your verified sender
        templateId: process.env.FORGET_TEMPLATE,
        personalizations: [
          {
            to: [
              {
                email: to,
              },
            ],
            dynamic_template_data: {
              otp,
              name: name
            },
          },
        ],
    }
}

export const addAdminMail = (to, name, otp, password) => {
    return{
        from: config.mailOptions.from, // sender address Change to your verified sender
        templateId: process.env.WELCOME_TEMPLATE,
        personalizations: [
          {
            to: [
              {
                email: to,
              },
            ],
            dynamic_template_data: {
              otp,
              name,
              password
            },
          },
        ],
    }
}