const fs = require('fs');
const path = require('path');

module.exports = function (config) {
  // Logic to detect available browsers on Windows
  const availableBrowsers = [];
  
  const checkPaths = (paths) => paths.some(p => fs.existsSync(p));

  const paths = {
    chrome: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ],
    edge: [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ],
    firefox: [
      'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
      'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe'
    ],
    brave: [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe')
    ]
  };

  let bravePath = paths.brave.find(p => fs.existsSync(p));
  let edgePath = paths.edge.find(p => fs.existsSync(p));

  if (checkPaths(paths.firefox)) availableBrowsers.push('Firefox');
  if (checkPaths(paths.chrome) || process.env.CHROME_BIN) availableBrowsers.push('Chrome');
  if (edgePath) availableBrowsers.push('Edge');
  if (bravePath) availableBrowsers.push('Brave');

  // Fallback if none found
  const defaultBrowsers = availableBrowsers.length > 0 ? [availableBrowsers[0]] : ['Chrome'];

  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage')
    ],
    client: {
      jasmine: {},
      clearContext: false
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: path.join(__dirname, './coverage/inkapt'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: defaultBrowsers,
    customLaunchers: {
      Brave: {
        base: 'Chrome',
        flags: ['--no-sandbox'],
        binary: bravePath
      },
      Edge: {
        base: 'Chrome',
        flags: ['--no-sandbox'],
        binary: edgePath
      }
    },
    singleRun: false,
    restartOnFileChange: true
  });
};
