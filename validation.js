export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUTR = (utr) => {
  return /^\d{12}$/.test(utr);
};

export const validatePrice = (price) => {
  return !isNaN(price) && price > 0;
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const sanitizeInput = (input) => {
  return input.trim().replace(/[<>]/g, '');
};
