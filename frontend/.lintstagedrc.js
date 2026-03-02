module.exports = {
  // TypeScript/JavaScript files
  "**/*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],

  // JSON and Markdown files
  "**/*.{json,md}": ["prettier --write"],

  // TypeScript type checking (without fixing)
  "**/*.{ts,tsx}": () => "tsc --noEmit",
};
