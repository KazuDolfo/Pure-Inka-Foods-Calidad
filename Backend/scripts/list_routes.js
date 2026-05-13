require('dotenv').config();
const app = require('../src/app');
const listEndpoints = require('express-list-endpoints');

console.log('--- REGISTERED ROUTES ---');
const endpoints = listEndpoints(app);
endpoints.forEach(route => {
    console.log(`${route.methods.join(', ')} ${route.path}`);
});
process.exit(0);
