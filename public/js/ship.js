var socket = io();


socket.emit('init', window.location.pathname.substring(1, window.location.pathname.length));

socket.on('init', function(obj) {

    //console.log(obj.players.length);
    console.log(obj.players);
    vm.ships = obj.ships;
    vm.room = window.location + obj.room;
	vm.playerState = obj;
	if (obj.players.length == 2)
		vm.statusMessage = 'Not ready';

	console.log(obj.players);
	obj.players.forEach(function(e, i) {
		if (e.id != obj.id)
			if (e.ready) {
				vm.opponentReady = true;
				vm.statusMessage = 'Ready';
			}
	});
});

socket.on('gameover', function(players) {

	var opponent;

	for (var i = 0; i < players.length; i++) {
		if (players[i].id != vm.playerState.id) opponent = players[i];
	}

	console.log(opponent);

	for (var i = 0; i < opponent.ships.length; i++) {

		for (var n = 0; n < opponent.ships[i].location.length; n++) {
			document.querySelector('[data-opcords="'+ opponent.ships[i].location[n] +'"]').style.backgroundColor = "#464545";
		}

	}

});

socket.on('canFire', function(obj) {
	// check if current user or opponent can fire
	console.log(obj.id + '  ' + vm.playerState.id);
	if(vm.playerState.id == obj.id)
    	vm.canFire = true;
    else
    	vm.canFire = false;
});

socket.on('playerJoined', function() {
	vm.statusMessage = 'Not ready';
});

socket.on('opponentLeft', function () {
	vm.statusMessage = 'Opponent left';
});

socket.on('opponentReady', function() {
	vm.opponentReady = true;
	vm.statusMessage = 'Ready';
	console.log('opponent is ready');
});

socket.on('win', function() {
	alert('you win');
});

socket.on('takeFire', function(obj) {

    if (obj.opponent.takenHits == obj.opponent.locations.length) {
        alert('YOU LOSE!');
    }

	var tile = document.querySelector('[data-cords="'+ obj.cords +'"]');

	if (tile.getAttribute('class') == 'placed-tile') {
		tile.style.backgroundColor = "red";
        vm.statusMessage = 'Opponent turn';
	} else {
		tile.style.backgroundColor = "cornflowerblue";
        vm.statusMessage = 'Your turn';
	}
});

socket.on('hit', function(obj) {

	console.log('hit ' + obj.hit);

	if (obj.hit) {
		document.querySelector('[data-opcords="'+ obj.cords +'"]').style.backgroundColor = "red";
        vm.statusMessage = 'Your turn';
        vm.canFire = true;
	} else {
		document.querySelector('[data-opcords="'+ obj.cords +'"]').style.backgroundColor = "cornflowerblue";
        vm.statusMessage = 'Opponent turn';
        vm.canFire = false;
	}
});

/*-----------------------------------------------------------------------*/

Vue.component('board', {
	template: "#board-template",
	props: ['cols', 'rows'],

	computed: {
		chr: function(n) { return String.fromCharCode(65); }
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
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) + i) +'"]');
						if (e.className == 'placed-tile') overlap = true;
					}
					else {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) - i) +'"]');
						if (e.className == 'placed-tile') overlap = true;
					}
				} else if (!this.$root.rotated) {
					if (document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * this.cols)) +'"]') != null) {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * this.cols)) +'"]');
						if (e.className == 'placed-tile') overlap = true;
					}
					else {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) - ((size - i) * this.cols)) +'"]');
						if (e.className == 'placed-tile') overlap = true;
					}
				}

			}

			if (!overlap) {
				this.$root.selectedShip.amount--;

				for (var i = 0; i < hoveredTile.length; i++) {
					hoveredTile[i].className = 'placed-tile';
					this.$root.selectedShip.location.push(hoveredTile[i].getAttribute('data-cords'));
				}
				socket.emit('place', this.$root.selectedShip);
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
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) + i) +'"]');
						e.className = e.className == 'placed-tile' ? 'placed-tile' : 'tile-hover';
					}
					else {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) - i) +'"]');
						e.className = e.className == 'placed-tile' ? 'placed-tile' : 'tile-hover';
					}
				} else if (!this.$root.rotated) {
					if (document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * this.cols)) +'"]') != null) {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * this.cols)) +'"]');
						e.className = e.className == 'placed-tile' ? 'placed-tile' : 'tile-hover';
					}
					else {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) - ((size - i) * this.cols)) +'"]');
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
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) + i) +'"]');
						e.className  = e.className == 'placed-tile' ? 'placed-tile' : 'tile';
					}
					else {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) - i) +'"]');
						e.className  = e.className == 'placed-tile' ? 'placed-tile' : 'tile';
					}
				} else if (!this.$root.rotated) {
					if (document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * this.cols)) +'"]') != null) {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) + (i * this.cols)) +'"]');
						e.className  = e.className == 'placed-tile' ? 'placed-tile' : 'tile';
					}
					else {
						var e = document.querySelector('[data-cords="'+ (parseInt(setCords) - ((size - i) * this.cols)) +'"]');
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

			if(!(this.$root.ready && this.$root.opponentReady && this.$root.canFire)) return;

			if(el.currentTarget.getAttribute('data-hittable') == 'true') {

				socket.emit('fire', {'playerState': this.playerState, 'cords' : parseInt(el.currentTarget.getAttribute('data-opcords')) } );

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
		ships: [],	
		selectedShip: null,
		statusMessage: 'Waiting for opponent',
		rotated: false, //vertical
		opponentReady: false,
		ready: false,
		playerState: null,
		canFire: false,
        room: null
	},

	methods: {
		setSelectedShip: function(ship) {
			this.selectedShip = ship;
		}
	},

	computed: {

		isHost: function() {
			if (window.location.pathname == '/')
				return true;

			return false;
		},

		ready: function() {

			if (this.ships.length == 0) return;

			var ready = true;

			this.ships.forEach(function(element, index) {
				if (element.amount > 0)
					ready = false;
			});

			if (ready) {
				this.ready = true;

				var locations = [];

				var tiles = document.querySelectorAll('.placed-tile');

				for (var i = 0; i < tiles.length; i++)
					locations.push(parseInt(tiles[i].getAttribute('data-cords')));
				
				socket.emit('ready', {'playerState' : this.playerState, 'locations' : locations });
			}

			return ready;

		}
	}

});

Vue.config.debug = true;