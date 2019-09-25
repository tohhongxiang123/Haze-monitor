const express = require('express');
const app = express();
const cors = require('cors');
const fetch = require('node-fetch');
const tz = require('moment-timezone');
const moment = require('moment');
require('dotenv').config();

// i dislike closures but theyre so useful
const fetchData = ((api_url='https://api.data.gov.sg/v1/environment/psi') => {
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
                    if (data.items) {
                        // store the new data in the cache
                        cache[moment(data.items[data.items.length - 1].timestamp).hour()] = data;

                        // delete any entries older than 4 hours
                        for (const [key, value] of Object.entries(cache)) {
                            if (parseInt(moment().hour()) - parseInt(key) > 4) {
                                delete cache[key];
                            }
                        }
                        return data
                    } else {
                        // return the latest cache, which is usually the hour before
                        const previousHour = (moment().hour() - 1)%23;
                        if (previousHour < 0) {
                            previousHour += 24;
                        }
                        return cache[previousHour];
                    }
                } else {
                    throw Error("API not healthy right now. Please try again later");
                }
            } catch(e) {
                throw Error("Failed to fetch data");
            }
        },
        getCache: function(key) {
            console.log(cache);
            if (typeof key !== 'string') {
                key = key.toString();
            }
            return cache[key];
        },
        deleteFromCache: function(date_to_delete) {
            delete cache[date_to_delete];
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
        let current_hour_data = fetchData.getCache(current_hour);

        if (!current_hour_data) {
            // if not, fetch new data
            console.log('Fetch new data');
            current_hour_data = await fetchData.fetchFrom(date);
        }

        return res.json(current_hour_data);
    } catch(e) {
        return res.status(400).json({status: "failed", error:e})
    }
})

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))