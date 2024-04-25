const express = require('express')
const app = express()
const cors = require('cors');
const bodyParser = require('body-parser')
require('dotenv').config()
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
	const { username } = req.body;
	const data = {
		name: username
	};

	const name = await prisma.user.findMany({
		where: {
			name: username
		}
	})

	if ( name[name.length - 1] == undefined ) {
		const result = await prisma.user.create({
			data: data
		})
		res.send({
			_id: result.id,
			username: result.name
		})
	} else {
		res.send({
			_id: name[name.length - 1].id,
			username: name[name.length - 1].name
		})	
	}
})

app.post(`/api/users/:_id/exercises`, async (req, res) => {
	const { description, duration, date } = req.body;
	const { _id } = req.params;
	let userData = {};

	if ( date == '' ) {
		userData = {
			data: {
				userId: _id,
				description: description,
				duration: parseInt(duration),
				date: new Date
			}
		}		
	} else {
		userData = {
			data: {
				userId: _id,
				description: description,
				duration: parseInt(duration),
				date: new Date(date).toISOString() 
			}
		}
	}

	const create = await prisma.exercise.create(userData);
	const user = await prisma.user.findMany({
		where: {
			id: _id
		}
	})

	res.send({
		_id: _id,
		username: user[user.length - 1].name,
		date: create.date.toDateString(),
		duration: create.duration,
		description: description
	})
})

app.get(`/api/users`, async (req, res) => {
	const user = await prisma.user.findMany();

	res.send({
		user
	})
})

app.get(`/api/users/:_id/logs`, async (req, res) => {
	const { _id } = req.params;
	const { from, to, limit } = req.query;

	const user = await prisma.user.findMany({
		where: {
			id: _id
		}
	})

	const size = await prisma.exercise.findMany({
		where: {
			userId: _id
		}
	})

	const exercise = await prisma.exercise.findMany({
		where: {
			userId: _id,
			date: {
				gte: from == undefined ? new Date(null) : new Date(from),
				lte: to == undefined ? new Date() : new Date(to)
			},
		},
		
		take: parseInt(limit) || size.length,
		select: {
			description: true,
			duration: true,
			date: true
		}
	})

	let logs = []

	exercise.forEach((elem) => {
		let log = {
			description: elem.description,
			duration: elem.duration,
			date: elem.date.toDateString()
		}
		logs.push(log)
	})

	let respons = {
		_id: _id,
		username: user[user.length - 1].name,
		from: new Date(from).toDateString(),
		to: new Date(to).toDateString(),
		count: exercise.length,
		log: logs
	}

	if ( to == undefined  ) {
		delete respons.to
	}

	if ( from == undefined ) {
		delete respons.from
	}

	res.send(respons)
})

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port)
})
