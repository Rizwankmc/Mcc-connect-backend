import jwt from 'jsonwebtoken';
import AdminModel from '../models/adminModel.js';
import UserModel from '../models/userModel.js';

const secret = process.env.NODE_ENV === 'production' ? process.env.JWT_SECRET : 'secret';

const authService = () => {
  const issue = (payload) => jwt.sign(payload, secret, { expiresIn: '6h' });
  const refresh_issue = (payload) =>
    jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: '12d' });

  const protect = async (req, res, next) => {
    const token = req.headers.authorization;
    let referesh = false;
    if (token) {
      try {
        jwt.verify(token, secret, async function (err, decoded) {
          try {
            if (err) {
              console.log('error');

              if (err.name === 'TokenExpiredError') {
                const userId = jwt.verify(token, secret, { ignoreExpiration: true });
                referesh = true;
                console.log('Userid->', userId.id);
                const admin = await AdminModel.findOne({ _id: userId.id });
                const user = await UserModel.findOne({ _id: userId.id });
                if (admin && admin.refresh_token !== '') {
                  const admin_ref = jwt.verify(admin.refresh_token, process.env.REFRESH_SECRET);
                  if (admin_ref.id === userId.id) {
                    req.body.userId = userId.id;
                    return next();
                  }
                }
                if (user && user.refresh_token !== '') {
                  const user_ref = jwt.verify(user.refresh_token, process.env.REFRESH_SECRET);
                  if (user_ref.id === userId.id) {
                    req.body.userId = userId.id;
                    console.log('expire');
                    return next();
                  }
                }
                return res.send({ code: 401, msg: 'Session Expired' });
              } else {
                return res.send({ code: 401, msg: 'Not Authorized' });
              }
            }
            const userId = jwt.verify(token, secret);
            console.log('UUSer =>', userId.id);
            req.body.userId = userId.id;
            return next();
          } catch (error) {
            console.error(error);
            res.send({ code: 401, msg: 'Not Authorized' });
          }
        });
      } catch (error) {
        console.error(error);
        res.send({ code: 401, msg: 'Not Authorized' });
      }
    }
    if (!token) {
      res.send({ code: 401, msg: 'Not Authorized' });
    }
  };

  return {
    issue,
    refresh_issue,
    protect,
  };
};

export default authService;
