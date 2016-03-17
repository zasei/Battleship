var socket = io();


socket.on('id', function(obj) {
	vm.playerId = obj.id;
	if (obj.pcount == 2)
		vm.statusMessage = 'Not ready';
});

socket.on('playerJoined', function() {
	vm.statusMessage = 'Not ready';
});

socket.on('gameInProgress', function() {
	document.querySelector('body').innerHTML = '<h1>Game in progress</h1>';
});

socket.on('opponentReady', function() {
	vm.opponentReady = true;
	vm.statusMessage = 'Ready';
	console.log('opponent is ready');
});

/*-----------------------------------------------------------------------*/

Vue.component('board', {
	template: "#board-template",
	props: ['cols', 'rows'],

	computed: {
		chr: function(n) {
			return String.fromCharCode(65);
		}
	},

	methods: {

		placeShip: function(el) {

			if(this.$root.selectedShip == null || this.$root.selectedShip.amount == 0)
				return;

			var setCords = el.currentTarget.getAttribute('data-cords');
			var size = this.$root.selectedShip.size;

			var hoveredTile = document.querySelectorAll('.tile-hover');

			var overlap = false;

			for (var i = 0; i < size; i++) {

				if(this.$root.rotated) {
					if (parseInt(setCords.split("").reverse().join("")[0]) + size <= this.cols) {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) + (i)) +'"]');
						if (e.className == 'placed-tile') overlap = true;
					}
					else {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) - (i)) +'"]');
						if (e.className == 'placed-tile') overlap = true;
					}
				} else if (!this.$root.rotated) {
					if (document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * 10)) +'"]') != null) {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * 10)) +'"]');
						if (e.className == 'placed-tile') overlap = true;
					}
					else {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) - ((size - i) * 10)) +'"]');
						if (e.className == 'placed-tile') overlap = true;
					}
				}

			}

			if (!overlap) {

				this.$root.selectedShip.amount--;

				for (var i = 0; i < hoveredTile.length; i++) {
					hoveredTile[i].className = 'placed-tile';
				}
			}
		},

		changeStyle: function(el) {

			if(this.$root.selectedShip == null || this.$root.selectedShip.amount == 0)
				return;

			var setCords = el.currentTarget.getAttribute('data-cords');

			var size = this.$root.selectedShip.size;

			for (var i = 0; i < size; i++) {

				if(this.$root.rotated) {
					if (parseInt(setCords.split("").reverse().join("")[0]) + size <= this.cols) {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) + (i)) +'"]');
						e.className = e.className == 'placed-tile' ? 'placed-tile' : 'tile-hover';
					}
					else {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) - (i)) +'"]');
						e.className = e.className == 'placed-tile' ? 'placed-tile' : 'tile-hover';
					}
				} else if (!this.$root.rotated) {
					if (document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * 10)) +'"]') != null) {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * 10)) +'"]');
						e.className = e.className == 'placed-tile' ? 'placed-tile' : 'tile-hover';
					}
					else {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) - ((size - i) * 10)) +'"]');
						e.className = e.className == 'placed-tile' ? 'placed-tile' : 'tile-hover';
					}
				}

			}

		},

		setDef: function(el) {
			if(this.$root.selectedShip == null)
				return;
			var setCords = el.currentTarget.getAttribute('data-cords');

			var size = this.$root.selectedShip.size;

			for (var i = 0; i < size; i++)
				if(this.$root.rotated) {
					if (parseInt(setCords.split("").reverse().join("")[0]) + size <= this.cols) {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * 1)) +'"]');
						e.className  = e.className == 'placed-tile' ? 'placed-tile' : 'tile';
					}
					else {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) - ((i) * 1)) +'"]');
						e.className  = e.className == 'placed-tile' ? 'placed-tile' : 'tile';
					}
				} else if (!this.$root.rotated) {
					if (document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * 10)) +'"]') != null) {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * 10)) +'"]');
						e.className  = e.className == 'placed-tile' ? 'placed-tile' : 'tile';
					}
					else {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) - ((size - i) * 10)) +'"]');
						e.className  = e.className == 'placed-tile' ? 'placed-tile' : 'tile';
					}
				}
		}
	}

});

Vue.component('opponent-board', {
	template: "#opponent-board-template",
	props: ['cols', 'rows'],

	methods: {
		fire: function(el) {
			if(el.currentTarget.getAttribute('data-hittable') == 'true') {
				el.currentTarget.className = 'missed-tile';
				el.currentTarget.setAttribute('data-hittable', 'false');
			}
		}
	}

});

Vue.filter('convertChar', function(n) {
	return String.fromCharCode(64+n);
});

var vm = new Vue({
	el: "#game",

	data: {
		ships: [
			{ 'type': 'Aircraft carrier', 'size': 5, 'alive': true, 'hits': 0, 'amount': 1},
			{ 'type': 'Battleship', 'size': 4, 'alive': true, 'hits': 0, 'amount': 2},
			{ 'type': 'Submarine', 'size': 3, 'alive': true, 'hits': 0, 'amount': 3},
			{ 'type': 'Cruiser', 'size': 3, 'alive': true, 'hits': 0, 'amount': 3},
			{ 'type': 'Destroyer', 'size': 2, 'alive': true, 'hits': 0, 'amount': 4}
		],

		selectedShip: null,
		statusMessage: 'Waiting for opponent...',
		rotated: false,
		opponentReady: false,
		playerId: null,
		canFire: false
	},

	methods: {
		setSelectedShip: function(ship) {
			this.selectedShip = ship;
		}
	},

	computed: {
		ready: function() {
			var ready = true;

			this.ships.forEach(function(element, index) {
				if (element.amount > 0)
					ready = false;
			});

			if (ready) {
				socket.emit('ready', this.playerId);
			}

			return ready;

		}
	}

});