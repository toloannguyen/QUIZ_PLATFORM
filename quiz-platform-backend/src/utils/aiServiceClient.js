const axios = require('axios');

const aiServiceClient = axios.create({
    baseURL: process.env.AI_SERVICE_URL,
    timeout: 15000
});

module.exports = aiServiceClient;