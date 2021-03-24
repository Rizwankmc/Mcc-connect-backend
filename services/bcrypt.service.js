import bcrypt from 'bcryptjs';

const bcryptService = () => {
  const password = async (pass) => {
    const salt = await bcrypt.genSaltSync(10);
    const hash = await bcrypt.hashSync(pass, salt);

    return hash;
  };

  const comparePassword = (pw, hash) => bcrypt.compareSync(pw, hash);

  return {
    password,
    comparePassword,
  };
};

export default bcryptService;
