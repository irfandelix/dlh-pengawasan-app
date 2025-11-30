/**
 * @type {import("puppeteer").Configuration}
 */
const { join } = require('path');

module.exports = {
  // Mendownload Chrome ke folder lokal project (.cache) agar tidak hilang
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};