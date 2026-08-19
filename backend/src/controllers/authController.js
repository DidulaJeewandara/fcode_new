const { registerUser, loginUser, publicUser } = require('../services/authService');
const { isValidEmail, isNonEmptyString } = require('../utils/validators');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const { user, token } = await registerUser({ name: name.trim(), email: email.trim().toLowerCase(), password });
    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { user, token } = await loginUser({ email: email.trim().toLowerCase(), password });
    res.status(200).json({ user, token });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    res.status(200).json({ user: publicUser(req.user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, me };
