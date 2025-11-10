/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  verbose: true,
  clearMocks: true,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
