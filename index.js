const express = require('express');
const app = express();
const cors = require('cors');
const fetch = require('node-fetch');
const tz = require('moment-timezone');
const moment = require('moment');
require('dotenv').config();

// i dislike closures but theyre so useful
const fetchData = ((api_url='https://api.data.gov.sg/v1/environment/psi/') => {
    const cache = {};
    return  {
        // everytime we fetch we should be caching
        fetchFrom: async function(date) {
            try {
                const response = await fetch(api_url + `?date=${date}`, {mode: 'cors', headers: {"Content-Type": "application/json"}});
                console.log('FETCHED FROM,', response.url);
                data = await response.json();
        
                // make sure the api is healthy
                if (data.api_info.status === 'healthy') {
                    // make sure that there are items within the data received
                    if (data.items.length > 0) {
                        // store the new data in the cache
                        console.log('we can store new items');
                        data.items.forEach(item => {
                            const item_timestamp_hour = moment(item.timestamp).hour();
                            cache[item_timestamp_hour] = item;
                        });
                        return cache;
                    } else {
                        // check for empty object
                        if (Object.entries(cache).length === 0 && cache.constructor === Object) {
                            // usually occurs at midnight
                            // if there is no cache and fetching from api brings up no items, fetch the previous day data and cache it
                            const yesterday_date = moment(date).tz('Asia/Singapore').subtract(1, 'day').format('YYYY-MM-DD');

                            const response = await fetch(api_url + `?date=${yesterday_date}`, {mode: 'cors', headers: {"Content-Type": "application/json"}});
                            console.log('FETCHED FROM YESTERDAY,', response.url);
                            data = await response.json();

                            // make sure yesterday also has items
                            if (data.items.length > 0 && data.api_info.status === 'healthy') {
                                // store the new data in the cache
                                console.log(data.items);
                                console.log('we can store new items for yesterday');
                                data.items.forEach(item => {
                                    const item_timestamp_hour = moment(item.timestamp).hour();
                                    cache[item_timestamp_hour] = item;
                                });
                                return cache;
                            } else {
                                throw Error("Failed to fetch data. Please try again");
                            }
                        }
                    }
                } else {
                    throw Error("API not healthy right now. Please try again later");
                }
            } catch(e) {
                throw Error("Failed to fetch data");
            }
        },
        getLatestCache: function(key) {
            console.log('getting latest data', key);
            if (typeof key !== 'string') {
                key = key.toString();
            }
            return cache[key];
        },
        getCache: function() {
            console.log('getting entire cache');
            return cache;
        }
    }
})();

const PORT = process.env.PORT || 5000;

// middleware declaration
app.use(cors());
app.use(express.static('public')); // serve static files from the static directory

app.get('/psi', async (req, res) => {
    const api_url = 'https://api.data.gov.sg/v1/environment/psi';
    const response = await fetch(api_url, {mode: 'cors', headers: {"Content-Type": "application/json"}});
    console.log('FETCHED FROM asdfasdf,', response.url);

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
    const date = moment().tz('Asia/Singapore').format('YYYY-MM-DD');
    const current_hour = moment().hour();

    try {
        // check if the current hour's data is in cache
        let current_hour_data = fetchData.getLatestCache(current_hour);

        if (!current_hour_data || moment(current_hour_data.timestamp).day() !== moment(date).day()) {
            // if not, fetch new data
            console.log('Fetch new data');
            await fetchData.fetchFrom(date);
        } else {
            console.log('current hour data exists', current_hour_data.timestamp);
        }

        const data = fetchData.getCache();
        const items = [];
        for (const [key, value] of Object.entries(data)) {
            items.push(value);
        }

        items.sort((a, b) => {
            // sort by ascending (earliest time - latest time)
            const end = moment(b.timestamp);
            const start = moment(a.timestamp);
            const difference = start.diff(end);
            return difference;
        })

        return res.json({items});
    } catch(e) {
        console.log(e);
        return res.status(400).json({status: "failed"})
    }
})

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))