const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const { generateToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

const publicUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

const registerUser = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  const token = generateToken(user.id);
  return { user: publicUser(user), token };
};

const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user.id);
  return { user: publicUser(user), token };
};

module.exports = { registerUser, loginUser, publicUser };
