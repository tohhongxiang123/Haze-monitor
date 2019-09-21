const express = require('express');
const app = express();
const cors = require('cors');
const fetch = require('node-fetch');
const moment = require('moment');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// middleware declaration
app.use(cors());
app.use(express.static('public')); // serve static files from the static directory

app.get('/psi', async (req, res) => {
    const api_url = 'https://api.data.gov.sg/v1/environment/psi';
    const response = await fetch(api_url, {mode: 'cors', headers: {"Content-Type": "application/json"}});
    console.log('FETCHED FROM,', response.url);

    const data = await response.json();

    // check api is healthy
    if (data.api_info.status === 'healthy') {
        console.log('API IS GOOD TO GO');
    } else {
        return res.json({error: "API is not healthy right now. Please try again later:", api_info});
    }

    return res.json(data);
})

app.get('/psi/day', async (req, res) => {
    const api_url = 'https://api.data.gov.sg/v1/environment/psi';
    const response = await fetch(api_url + `?date=${moment().format('YYYY-MM-DD')}`, {mode: 'cors', headers: {"Content-Type": "application/json"}});
    console.log('FETCHED FROM,', response.url);

    const data = await response.json();

    // check api is healthy
    if (data.api_info.status === 'healthy') {
        console.log('API IS GOOD TO GO');
    } else {
        return res.json({error: "API is not healthy right now. Please try again later:", api_info});
    }

    return res.json(data);
})

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))