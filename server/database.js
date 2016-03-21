var Datastore = require('nedb'),
    rooms = new Datastore();

rooms.ensureIndex({fieldName: 'room', unique: true});

module.exports = {
	rooms: rooms
};