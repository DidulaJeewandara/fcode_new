const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email) => typeof email === 'string' && EMAIL_REGEX.test(email.trim());

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

module.exports = { isValidEmail, isNonEmptyString };
