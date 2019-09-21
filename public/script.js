fetchDataAndGraph();

        function fetchDataAndGraph() {
            fetch('psi/day')
            .then(res => res.json())
            .then(data => {
                // restructuring data for easier plotting
                console.log(data);

                let timestamps = [];
                let readings_by_region = {};
                let readings_by_measurement = {};

                // transforming data to plot
                data.items.forEach(item => {
                    const item_div = document.createElement('div');
                    item_div.className = `reading ${item.timestamp}`;

                    const readings_div = document.createElement('div');
                    readings_div.className = 'values';

                    const timestamp_title = document.createElement('h2');
                    const {timestamp} = item;

                    const date = timestamp.split('T')[0];
                    const time = timestamp.split('T')[1].split('+')[0];
                    timestamps.push(`${date} ${time}`);
                    timestamp_title.innerText = `${date}, ${time}`;

                    const {readings} = item;

                    for (const [reading, values] of Object.entries(readings)) {
                        const reading_div = document.createElement('div');
                        reading_div.className = `${item.timestamp} ${reading}`;

                        if (!readings_by_measurement[reading]) {
                            readings_by_measurement[reading] = {};
                        }

                        const reading_title = document.createElement('h4');
                        reading_title.innerText = reading;

                        reading_div.appendChild(reading_title);

                        for (const [location, single_reading] of Object.entries(values)) {
                            if (!readings_by_region[location]) {
                                readings_by_region[location] = {};
                            }

                            if (!readings_by_region[location][reading]) {
                                readings_by_region[location][reading] = [];
                            }

                            if (!readings_by_measurement[reading][location]) {
                                readings_by_measurement[reading][location] = [];
                            }

                            readings_by_region[location][reading].push(single_reading);
                            readings_by_measurement[reading][location].push(single_reading);

                            const text = `${location}: ${single_reading}`;
                            const reading_el = document.createElement('p');
                            reading_el.innerText = text;
                            reading_div.appendChild(reading_el);
                        }

                        readings_div.appendChild(reading_div);
                    }

                    

                    item_div.appendChild(timestamp_title);
                    item_div.appendChild(readings_div);
                    document.querySelector('.readings').appendChild(item_div);
                });

                let overall_dataset = [];
                let national_dataset = [];

                let colors = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
                                '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
                                '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
                                '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
                                '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
                                '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
                                '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
                                '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
                                '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
                                '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
                colors = colors.map(color => color + '80');
                // more colors , 

                // plotting data
                let counter = 0;
                for (const [location, measurements] of Object.entries(readings_by_region)) {
                    for (const [category, data] of Object.entries(measurements)) {
                        let current_dataset = {
                            label: `${category.split('_').join(' ')} (${location})`,
                            data: data,
                            fill: false,
                            backgroundColor: colors[counter % colors.length],
                            borderColor: colors[counter % colors.length]
                            
                        }
                        overall_dataset.push(current_dataset);
                        counter++;
                    }
                }

                console.log(overall_dataset);

                // plotting graph by region
                for (const location of ['national', 'north', 'south', 'east', 'west', 'central']) {
                    const psi_reading_display = document.querySelector(`.current_${location}_psi_reading`);
                    const psi_reading_container = psi_reading_display.parentElement.parentElement;
                    const psi_reading = parseInt(readings_by_region[location]['psi_twenty_four_hourly'][readings_by_region[location]['psi_twenty_four_hourly'].length - 1]);
                    psi_reading_display.innerText = psi_reading;
                    switch(true) {
                        case 0 <= psi_reading && psi_reading <= 50:
                            psi_reading_container.classList.add('good');
                            break;
                        case 50 < psi_reading && psi_reading <= 100:
                            psi_reading_container.classList.add('moderate');
                            break;
                        case 100 < psi_reading && psi_reading <= 200:
                            psi_reading_container.classList.add('unhealthy');
                            break;
                        case 200 < psi_reading && psi_reading <= 300:
                            psi_reading_container.classList.add('very-unhealthy');
                            break;
                        case psi_reading >= 300:
                            psi_reading_container.classList.add('hazardous');
                            break;
                    }
                    
                    const ctx = document.getElementById(`${location}_readings`).getContext('2d');
                    const myChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: timestamps,
                            datasets: overall_dataset.filter(dataset => dataset.label.includes(location))
                        },
                        options: {
                            legend: {
                                position: 'bottom'
                            },
                            maintainAspectRatio: false,
                            title: {
                                display: true,
                                text: `${location.replace(/^\w/, c => c.toUpperCase())} readings`,
                                position: 'bottom'
                            },
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero: true
                                    },
                                    gridLines: {
                                        color: "#131c2b"
                                    }
                                }],
                                xAxes: [{
                                    ticks: {
                                        maxRotation: 90
                                    },
                                    gridLines: {
                                        color: "#131c2b"
                                    }
                                }]
                            }
                        }
                    });
                }

                // plotting graph by measurement
                for (const [measurement, values] of Object.entries(readings_by_measurement)) {
                    const ctx = document.getElementById(`${measurement}_readings`).getContext('2d');
                    const myChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: timestamps,
                            datasets: overall_dataset.filter(dataset => dataset.label.includes(measurement.split('_').join(' ')))
                        },
                        options: {
                            maintainAspectRatio: false,
                            legend: {
                                position: 'bottom'
                            },
                            title: {
                                display: true,
                                text: document.querySelector(`#nav-${measurement}-tab`).innerText,
                                position: 'bottom'
                            },
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero: false
                                    },
                                    gridLines: {
                                        color: "#131c2b"
                                    }
                                }],
                                xAxes: [{
                                    ticks: {
                                        maxRotation: 90
                                    },
                                    gridLines: {
                                        color: "#131c2b"
                                    }
                                }]
                            }
                        }
                    });
                }

                console.log(readings_by_region);
                console.log(readings_by_measurement);

                // setting up map
                let {region_metadata} = data;
                // const mymap = L.map('mapid', {crs: L.CRS.Simple}).setView([1.35735, 103.82], 12);
                // mymap.scrollWheelZoom.disable();
                // const bounds = [[1.176130, 103.607029], [1.469094, 104.082162]];
                // L.imageOverlay('singapore.svg', bounds).addTo(mymap);

                const mymap = L.map('mapid').setView([1.35735, 103.82], 12);
                mymap.scrollWheelZoom.disable();
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    maxZoom: 18
                }).addTo(mymap);
                
                region_metadata.forEach(region => {
                    const {label_location} = region;
                    if (region.name !== 'national') {
                        const current_region_psi = readings_by_region[region.name]['psi_twenty_four_hourly'][readings_by_region[region.name]['psi_twenty_four_hourly'].length - 1];
                        const marker = L.marker([label_location.latitude, label_location.longitude]).addTo(mymap);

                        marker.bindPopup(`${region.name.replace(/^\w/, c => c.toUpperCase())} PSI: <b>${current_region_psi}</b>`).addTo(mymap);
                        marker.on('mouseover', () => marker.openPopup());
                        marker.on('mouseout ', () => marker.closePopup())
                        document.querySelector(`.${region.name}`).addEventListener('mouseover', (e) => marker.openPopup(), false);
                        document.querySelector(`.${region.name}`).addEventListener('mouseleave', (e) => marker.closePopup(), false);
                    }
                })
                
            });
        }