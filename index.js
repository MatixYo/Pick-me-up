const express = require('express'),
app = express(),
path = require('path');

const drivers = [
	{
		id: "1",
		name: "Nico Rosberg",
		car: "Talon I",
		carIcon: "images/typ2.png",
		carImage: "images/typ2zdj.png",
		height: 85,
		lng: 0.758000,
		ltd: 0.782000,
		angle: 1
	},
	{
		id: "2",
		name: "Felipe Massa",
		car: "Century Falcon",
		carIcon: "images/typ3.png",
		carImage: "images/typ3zdj.png",
		height: 85,
		lng: 0.985000,
		ltd: 0.085000,
		angle: 3
	},
	{
		id: "3",
		name: "Daniel Ricciardo",
		car: "Sea Devil",
		carIcon: "images/typ4.png",
		carImage: "images/typ4zdj.png",
		height: 85,
		lng: 0.780000,
		ltd: 0.047000,
		angle: 4
	},
	{
		id: "4",
		name: "Albert Einstein",
		car: "Space Tesla",
		carIcon: "images/typ5.png",
		carImage: "images/typ5zdj.png",
		height: 85,
		lng: 0.012000,
		ltd: 0.870000,
		angle: 5.5
	},
	{
		id: "5",
		name: "Lewis Hamilton",
		car: "Fighting Fish",
		carIcon: "images/typ1.png",
		carImage: "images/typ1zdj.png",
		height: 85,
		lng: 0.010000,
		ltd: 0.065000,
		angle: 1
	}
];

const z = 0.0125;

setInterval(() => {
	drivers.forEach((driver, key) => drivers[key].angle = Math.random()*2*Math.PI);
}, 5000);

setInterval(() => {
	drivers.forEach((driver, key) => {
		if(driver.tox && driver.toy && Math.abs(driver.tox - driver.lng) > .025) {
			drivers[key].lng = driver.lng - (driver.lng - driver.tox) / 20;
			drivers[key].ltd = driver.ltd - (driver.ltd - driver.toy) / 20;
		} else {
			drivers[key].lng = driver.lng + Math.cos(driver.angle)*z;
			drivers[key].ltd = driver.ltd + Math.sin(driver.angle)*z;
		}
	})
}, 500);

app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/index.html')))
	.get('/get-visible-vehicles', (req, res) => {
		const returned = drivers.filter(driver => driver.lng >= req.query.x_min && driver.lng <= req.query.x_max && driver.ltd >= req.query.y_min && driver.ltd <= req.query.y_max);
		res.end(JSON.stringify(returned));
	})
	.get('/get-closest-vehicle', (req, res) => {
		let closest = {},
		least = 360,
		k;
		drivers.forEach((driver, key) => {
			let distance = Math.pow(req.query.x - driver.lng, 2) + Math.pow(req.query.y - driver.ltd, 2);
			if(distance < least) {
				least = distance;
				closest = driver;
				k = key;
			}
		});
		drivers[k].tox = req.query.x;
		drivers[k].toy = req.query.y;
		res.end(JSON.stringify(closest));
	})
	.use('/images', express.static('images'))
	.use(express.static('static'))
	.listen(80);
