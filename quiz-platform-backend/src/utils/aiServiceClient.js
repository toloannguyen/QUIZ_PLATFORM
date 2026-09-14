const axios = require('axios');

const aiServiceClient = axios.create({
    baseURL: process.env.AI_SERVICE_URL,
    timeout: 60000
});

module.exports = aiServiceClient;