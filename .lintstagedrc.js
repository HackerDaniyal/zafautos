module.exports = {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,jsx,mjs}': ['eslint --fix', 'prettier --write'],
  '*.{css,md,json}': ['prettier --write'],
};
