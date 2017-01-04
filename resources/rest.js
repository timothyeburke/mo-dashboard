const http     = require('http')
const https    = require('https')
const Forecast = require('forecast.io')
const xml      = require('xml2js')
const _        = require('lodash')

const keys = JSON.parse(process.env.WMATA_API_KEYS)

function getWmataApiKey() {
    const key = keys[Math.floor(Math.random() * keys.length)]
    return `&api_key=${key}&subscription-key=${key}`
}

module.exports = function(app) {
    'use strict';

    const db = {
        south: {
            Predictions: [],
            StopName: ''
        },
        north: {
            Predictions: [],
            StopName: ''
        },
        toUSt: {
            Predictions: [],
            StopName: ''
        },
        G8West: {
            Predictions: [],
            StopName: ''
        },
        B35: { // New York Ave Metro
            Predictions: [],
            StationName: 'New York Ave'
        },
        B04: { // Rhode Island Ave Metro
            Predictions: [],
            StationName: 'Rhode Island Ave'
        },
        E02: { // Shaw Metro
            Predictions: [],
            StationName: 'Shaw / Howard U'
        },
        liveBusses: [],
        bikeshare: [],
        car2go: [],
        incidents: [],
        weather: {}
    }

    const bbox = {
        westLon:  -77.012500,
        eastLon:  -76.997900,
        southLat:  38.908567,
        northLat:  38.920694
    }

    function isInBbox(lon, lat, westLon, eastLon, southLat, northLat) {
        return westLon <= lon && lon <= eastLon && southLat <= lat && lat <= northLat
    }

    function getBusPositions() {
        function fetchPositions() {
            const options = {
                hostname: 'api.wmata.com',
                port: 443,
                path: `/Bus.svc/json/jBusPositions?RouteID&Lat=38.9155&Lon=-77.0050&Radius=1600${getWmataApiKey()}`,
                method: 'GET'
            }

            let data = ''
            https.get(options, (response) => {
                response.on('data', (d) => {
                    data += d
                })

                response.on('end', () => {
                    try {
                        const busses = JSON.parse(data)

                        db.liveBusses.length = 0
                        busses.BusPositions.forEach((bus) => {
                            bus.latitude = bus.Lat
                            bus.longitude = bus.Lon
                            db.liveBusses.push(bus)
                        })

                        db.liveBusses = _.filter(db.liveBusses, (bus) => {
                            return isInBbox(bus.Lon, bus.Lat, bbox.westLon, bbox.eastLon, bbox.southLat, bbox.northLat)
                        })
                    } catch (err) {
                        console.log('Error parsing json.')
                    }
                })

                response.on('error', () => {
                    console.log(`${new Date().toString()} : Error getting live bus data.`)
                })
            })
        }

        fetchPositions()
    }

    getBusPositions()
    setInterval(getBusPositions, 1000 * 10)

    function getBusPredictions() {
        const errorObject = {
            Predictions: [],
            StopName: 'Error fetching bus data.'
        }

        function fetchPredictions(stop, direction) {
            const options = {
                hostname: 'api.wmata.com',
                port: 443,
                path: `/NextBusService.svc/json/jPredictions?StopID=${stop}${getWmataApiKey()}`,
                method: 'GET'
            }

            let data = ''
            https.get(options, (response) => {
                response.on('data', (d) => {
                    data += d
                })

                response.on('end', () => {
                    try {
                        db[direction] = JSON.parse(data)
                    } catch (err) {
                        db[direction] = errorObject
                    }
                    if (db[direction] === undefined) {
                        db[direction] = errorObject
                    }
                })

                response.on('error', () => {
                    console.log(`${new Date().toString()} : Error getting bus data.`)
                })
            })
        }
        fetchPredictions(1001624, 'south')
        fetchPredictions(1001425, 'toUSt')
        fetchPredictions(1001715, 'G8West')
    }
    getBusPredictions()
    setInterval(getBusPredictions, 1000 * 30)

    function getIncidents() {
        const options = {
            hostname: 'api.wmata.com',
            port: 443,
            path: `/Incidents.svc/json/Incidents?${getWmataApiKey()}`,
            method: 'GET'
        }

        let temp = ''
        https.get(options, (response) => {
            response.on('data', (d) => {
                temp += d
            })

            response.on('end', () => {
                try {
                    db.incidents = JSON.parse(temp).Incidents
                    db.incidents.forEach((incident) => {
                        incident.affected = _.compact(incident.LinesAffected.split(';'))
                        incident.Description = _.trim(incident.Description.replace(/(Blue|Orange|Red|Silver|Green|Yellow) Line\:/ig, ''))
                        if (incident.Description.indexOf('.') !== -1) {
                            incident.Description = `${incident.Description.split('.')[0]}.`
                        }
                    })
                } catch (err) {
                }
                if (db.incidents === undefined) {
                    db.incidents = []
                }
            })

            response.on('error', () => {
                console.log(`${new Date().toString()} : Error getting incident data.`)
            })
        })
    }
    getIncidents()
    setInterval(getIncidents, 1000 * 60)

    function getWeather() {
        const lon = -77.0033354
        const lat =  38.9152131
        const forecast_key = '2cb1727e2157365c87d67c621ec1bf43'

        const forecast = new Forecast({
            APIKey: forecast_key
        })

        forecast.get(lat, lon, (err, res, data) => {
            if (err) {
                console.log(new Date().toString() + ' : ' + err)
                db.weather = {}
                return
            }
            data.currently.low = _.min(data.hourly.data, (hour) => {
                return hour.temperature
            })
            data.currently.high = _.max(data.hourly.data, (hour) => {
                return hour.temperature
            })
            db.weather = data.currently
        })
    }
    getWeather()
    setInterval(getWeather, 1000 * 60 * 10)

    function getTrainPredictions() {
        function fetchPredictions(station) {
            const options = {
                hostname: 'api.wmata.com',
                port: 443,
                path: `/StationPrediction.svc/json/GetPrediction/${station}?${getWmataApiKey()}`,
                method: 'GET'
            }

            let temp = ''
            https.get(options, (response) => {
                response.on('data', (d) => {
                    temp += d
                })

                response.on('end', () => {
                    try {
                        db[station].Predictions = JSON.parse(temp).Trains
                        db[station].Predictions.forEach((train) => {
                            if (train.Line !== 'RD' && train.Line !== 'GR' &&
                                train.Line !== 'YL' && train.Line !== 'SV' &&
                                train.Line !== 'SV' && train.Line !== 'OR') {
                                train.Line = ''
                            }
                        })
                    } catch (err) {
                    }
                })

                response.on('error', () => {
                    console.log(`${new Date().toString()} : Error getting train data.`)
                })
            })
        }
        fetchPredictions('B35')
        fetchPredictions('B04')
        fetchPredictions('E02')
    }
    getTrainPredictions()
    setInterval(getTrainPredictions, 1000 * 90)

    function getBikeshareData() {
        function processBikeshareXML(data) {
            db.bikeshare.length = 0
            xml.parseString(data, (err, result) => {
                const stations = result.stations.station
                stations.forEach((station) => {
                    const id = station.id[0]
                    const lon = station.long[0]
                    const lat = station.lat[0]

                    if (isInBbox(lon, lat, bbox.westLon, bbox.eastLon, bbox.southLat, bbox.northLat)) {
                        db.bikeshare.push({
                            id: station.id[0],
                            name: station.name[0],
                            terminalName: station.terminalName[0],
                            lastCommWithServer: station.lastCommWithServer[0],
                            latitude: station.lat[0],
                            longitude: station.long[0],
                            nbBikes: station.nbBikes[0],
                            nbEmptyDocks: station.nbEmptyDocks[0]
                        })
                    }
                })
            })
        }

        const options = {
            hostname: 'feeds.capitalbikeshare.com',
            port: 443,
            path: '/stations/stations.xml',
            method: 'GET'
        }

        let temp = ''
        https.get(options, (response) => {
            response.on('data', (d) => {
                temp += d
            })

            response.on('end', () => {
                processBikeshareXML(temp)
            })

            response.on('error', (err) => {
                console.log(`${new Date().toString()} : Error getting Bikeshare data.`)
            })
        })
    }
    getBikeshareData()
    setInterval(getBikeshareData, 1000 * 60)

    function getCar2GoData() {
        const options = {
            hostname: 'www.car2go.com',
            port: 443,
            path: '/api/v2.0/vehicles?loc=Washington%20DC&format=json',
            method: 'GET'
        }

        let temp = ''
        https.get(options, (response) => {
            response.on('data', (d) => {
                temp += d
            })

            response.on('end', () => {
                try {
                    var car2go = JSON.parse(temp)
                    db.car2go.length = 0
                    car2go.placemarks.forEach((car) => {
                        car.coordinates = eval(car.coordinates)
                        var lon = car.coordinates[0]
                        var lat = car.coordinates[1]
                        if (isInBbox(lon, lat, bbox.westLon, bbox.eastLon, bbox.southLat, bbox.northLat)) {
                            car.longitude = lon
                            car.latitude  = lat
                            db.car2go.push(car)
                        }
                    })
                } catch (err) {
                }
            })

            response.on('error', () => {
                console.log(`${new Date().toString()} : Error getting car2go data.`)
                db.car2go.length = 0
            })
        })
    }
    getCar2GoData()
    setInterval(getCar2GoData, 1000 * 60)

    app.get('/data.json', (req, res) => {
        res.contentType('application/json')
        res.send({
            bikeshare:  db.bikeshare,
            busses:    [db.south, db.toUSt, db.G8West],
            car2go:     db.car2go,
            incidents:  db.incidents,
            liveBusses: db.liveBusses,
            trains:    [db.B35, db.B04, db.E02],
            weather:    db.weather
        })
    })
}
