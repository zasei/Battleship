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

});

Vue.filter('convertChar', function(n) {
	return String.fromCharCode(64+n);
});

new Vue({
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
		rotated: false
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

			return ready;

		}
	}

});