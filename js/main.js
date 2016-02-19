
var main = {

	init: function()
	{

		// Create game area.
		Crafty.init(50, 960, 645);

		Crafty.sprite(60, "images/tests/spitfire/plane.png", {
			grass1: [0,0],
			grass2: [1,0],
			grass3: [2,0],
			grass4: [3,0],
			flower: [0,1],
			bush1:  [0,2],
			bush2:  [1,2],
			player: [0,3]
		});

		Crafty.sprite(140, "images/tests/spitfire/pilot.png", { pilotSprite: [0, 0] });
		Crafty.sprite(150, "images/tests/spitfire/enemy-frames.png", { enemySprite: [0, 0] });
		Crafty.sprite(64, "images/tests/spitfire/explosion-frames.png", { explosionSprite: [0, 0] });
		Crafty.sprite(60, "images/tests/spitfire/part1-frames.png", { part1Sprite: [0, 0] });
		Crafty.sprite(30, "images/tests/spitfire/part2-frames.png", { part2Sprite: [0, 0] });

		// The loading screen that will display while our assets load
		Crafty.scene("loading", function() 
		{
			// Load takes an array of assets and a callback when complete
			Crafty.load(
				[
					"images/tests/spitfire/plane.png", 
					"images/tests/spitfire/layout-bg.png", 
					"images/tests/spitfire/grass.png",
					"images/tests/spitfire/grass2.png",
					"images/tests/spitfire/house.png", 
					"images/tests/spitfire/layout-frame.png",
					"images/tests/spitfire/enemy-frames.png",
					"images/tests/spitfire/explosion-frames.png",
					"images/tests/spitfire/part1-frames.png",
					"images/tests/spitfire/part2-frames.png",
					"images/tests/spitfire/pilot.png",
					"images/tests/spitfire/smoke-frames.png",
					"images/tests/spitfire/ground-hangar.png",
					"images/tests/spitfire/ground-tower.png",
					"images/tests/spitfire/ground-tree.png"
				], function() 
			{			
				Crafty.scene("main"); //when everything is loaded, run the main scene
			});
		});


		// Black background 
		Crafty.background("#000");

		Crafty.scene("main", function() {
			statistics.log();

			// Add bg.
			var bg = Crafty.e("2D, DOM, image")
						.attr({w: Crafty.viewport.width, h: Crafty.viewport.height, x: 39, y: 20})
						.image("images/tests/spitfire/layout-bg.png");			
						
			// Add frame.
			var bg = Crafty.e("2D, DOM, image")
						.attr({w: Crafty.viewport.width, h: Crafty.viewport.height, z: 100})
						.image("images/tests/spitfire/layout-frame.png");			
						
			// Add ground.
			main.createGround();

			// Init pilot.
			pilot.init();

			// Create custom controls for player.
			Crafty.c('CustomControls', {
			
				_engineOn: true,
				_speed: 0,
				_angle: 0,

				_maxSpeed: 4,
				_acceleration: 0.05,
				_deacceleration: 0.03,
				_turnSpeed: 4,
				
				_lastBulletTime: 0,
				
				_turning: '',
			
				CustomControls: function() 
				{

					this.bind('enterframe', function(e) 
					{

						recorder.init(Crafty.frame(), this, gameConfig.playMode);
						recorder.saveState(this);

						// Limit max speed based on angle. Plane goes down faster.
						var maxSpeed = this._maxSpeed + 4 * Math.sin(this._angle / 57.3);

						// Handle keys.
						if (recorder.isDown(Crafty.keys.UP_ARROW)) 
						{
							if (this._speed < maxSpeed)
							{
								this._speed += this._acceleration;
							} else {
								this._speed -= this._deacceleration;
							}
						} else {
							this._speed -= this._deacceleration;
							if (this._speed < 0)
							{
								this._speed = 0;
							}
						}
						
						if (recorder.isDown(Crafty.keys.SPACE)) 
						{
	
							pilot.fire();
	
							var d = new Date();
							if (d.getTime() - this._lastBulletTime > 300)
							{
								this._lastBulletTime = d.getTime();

								statistics.addSprite();
								Crafty.e("2D, DOM, color, bullet")
									.attr({
										x: this._x + 30, 
										y: this._y + 30, 
										w: 2, 
										h: 2, 
										rotation: this._rotation, 
										xspeed: 10 * Math.sin((this._rotation + 90) / 57.3), 
										yspeed: 10 * Math.cos((this._rotation + 90) / 57.3)
									})
									.color("rgb(0, 0, 0)")
									.bind("enterframe", function() {
	
										this.x += this.xspeed;
										this.y -= this.yspeed;
								
										//destroy if it goes out of bounds
										if(this._x > Crafty.viewport.width || this._x < 0 || this._y > Crafty.viewport.height || this._y < 0) {
											statistics.destroySprite();
											this.destroy();
										}
									});
								
							}
						
						}
						
						if (recorder.isDown(Crafty.keys.RIGHT_ARROW)) 
						{
							this._turning = "right";
							this._angle += this._turnSpeed;
						} else if (recorder.isDown(Crafty.keys.LEFT_ARROW))
						{
							this._turning = "left";
							this._angle -= this._turnSpeed;
						} else {
							this._turning = "";
						}

						// Calculate x and y movements.
						var xDelta = this._speed * Math.cos(this._angle * (Math.PI/180));
						var yDelta = this._speed * Math.sin(this._angle * (Math.PI/180));
						
						this.x += xDelta;
						this.y += yDelta;
						
						this.rotation = this._angle;
						
					});
					
					return this;
					
				}
	
			});

			// Explosion component
			Crafty.c('explosion', {
			
				_delay: 0,
				_startFrame: 0,
				_reelId: "explode",
			
				explosion: function(delay) 
				{

					statistics.addSprite();

					this._startFrame = Crafty.frame();
					this._delay = delay;

					// Init settings.
					this.animate(this._reelId, 0, 0, 25).origin("center");

					// Bind event handler.
					this.bind("enterframe", function(e) 
					{
						//console.log("Frame: " + e.frame + " Start frame: " + this._startFrame + " Delay: " + this._delay + " Is playing: " + this.isPlaying());
						var elapsed = e.frame - this._startFrame;
						if (!this.isPlaying() && elapsed == this._delay)
						{
							this.animate(this._reelId, 50);
						} else if (!this.isPlaying() && elapsed > this._delay + 100) {
							statistics.destroySprite();
							this.destroy();
						}

					})
		
					return this;
				}
			});
			
			// Create player.
			statistics.addSprite();
			Crafty.e("2D, DOM, player, controls, CustomControls, animate, collision, health")
				.attr({
					x: 160, 
					y: 200, 
					w: 60,
					h: 60,
					z: 1,
					_lastAnimation: 'normal_idle',
					_direction: 'normal'
				})
				.CustomControls()
				.animate("normal_idle", 0, 0, 2)
				.animate("normal_turnleft_in", 10, 0, 15)
				.animate("normal_turnleft_out", 15, 0, 20)
				.animate("normal_turnright_in",20, 0, 25)
				.animate("normal_turnright_out",25, 0, 29)
				.animate("normal_turnover", 30, 0, 40)
				.animate("upsidedown_idle", 40, 0, 45)
				.animate("upsidedown_turnleft_in", 50, 0, 55)
				.animate("upsidedown_turnleft_out", 55, 0, 60)
				.animate("upsidedown_turnright_in", 60, 0, 65)
				.animate("upsidedown_turnright_out", 65, 0, 69)
				.animate("upsidedown_turnover", 70, 0, 79)
				.origin("center")
				.bind("enterframe", function() 
				{

					// Add enemy.
					if (main.enemyPositions.length > main.enemyCounter)
					{
						var currentEnemy = main.enemyPositions[main.enemyCounter];
						if (Crafty.frame() > currentEnemy.frame)
						{
							main.addEnemy();
						}
					}

					// Not playing any of the reels.
					if (
						!this.isPlaying("normal_idle")
						&& !this.isPlaying("normal_turnleft_in")
						&& !this.isPlaying("normal_turnleft_out")
						&& !this.isPlaying("normal_turnright_in")
						&& !this.isPlaying("normal_turnright_out")
						&& !this.isPlaying("normal_turnover")
						&& !this.isPlaying("upsidedown_idle")
						&& !this.isPlaying("upsidedown_turnleft_in")
						&& !this.isPlaying("upsidedown_turnleft_out")
						&& !this.isPlaying("upsidedown_turnright_in")
						&& !this.isPlaying("upsidedown_turnright_out")
						&& !this.isPlaying("upsidedown_turnover")
						)
					{
					
						//console.log("_lastAnimation: " + this._lastAnimation);

						// Play turn out animations.
						if (this._turning == "" && this._lastAnimation == this._direction + "_turnleft_in") {
							this.animate(this._direction + "_turnleft_out", 5); this._lastAnimation = this._direction + "_turnleft_out"; return this;

						} else if (this._turning == "" && this._lastAnimation == this._direction + "_turnright_in") {
							this.animate(this._direction + "_turnright_out", 5); this._lastAnimation = this._direction + "_turnright_out"; return this;

						} else if (this._turning == "left" && this._lastAnimation == this._direction + "_turnright_in") {
							this.animate(this._direction + "_turnright_out", 5); this._lastAnimation = this._direction + "_turnright_out"; return this;

						} else if (this._turning == "right" && this._lastAnimation == this._direction + "_turnleft_in") {
							this.animate(this._direction + "_turnleft_out", 5); this._lastAnimation = this._direction + "_turnleft_out"; return this;
						}
						
						// Play turn animations.
						if (this._turning == "left" && this._lastAnimation != this._direction + "_turnleft_in") {
							this.animate(this._direction + "_turnleft_in", 5); this._lastAnimation = this._direction + "_turnleft_in"; return this;
						} else if (this._turning == "right" && this._lastAnimation != this._direction + "_turnright_in") {
							this.animate(this._direction + "_turnright_in", 5); this._lastAnimation = this._direction + "_turnright_in"; return this;
						}
						
						var direction = Math.sin((this._angle + 90) / 57.3);
						if (this._lastAnimation == "normal_idle" && direction < 0) {
							this._direction = "upsidedown";
							this._lastAnimation = "normal_turnover";
							this.animate("normal_turnover", 20); 
							return this;
						}
						if (this._lastAnimation == "upsidedown_idle" && direction > 0) {
							this._direction = "normal";
							this._lastAnimation = "upsidedown_turnover";
							this.animate("upsidedown_turnover", 20); 
							return this;
						}
						
						if (this._turning == "") {
							//console.log("Idle");
							this.animate(this._direction + "_idle", 2); 
							this._lastAnimation = this._direction + "_idle"; 
							return this;
						}
					
					}


				})
				.collision()
				.onHit("Enemy", function(collisionData)
				{
					// Destroy enemy.
					if(collisionData) 
					{
						for(var i = 0; i < collisionData.length; i++) 
						{
						
							// Enemy object.
							var enemy = collisionData[i].obj;
							
							// Add explosion.
							main.addExplosion(enemy.x, enemy.y);
							
							// Destroy enemy.
							statistics.destroySprite();
							enemy.destroy();
							
						}
    				}
    				
    				// Destroy player.
					statistics.destroySprite();
					this.destroy();
					recorder.log();
					
				})
				.onHit("ground", function(collisionData) 
				{
					statistics.destroySprite();
					this.destroy();
					recorder.log();
				})
				.onHit("bomb", function(collisionData)
				{
					statistics.destroySprite();
					this.destroy();
					recorder.log();
				});

		});

		Crafty.scene("loading");
		
	},

	/**
	 * Add enemy plane.
	 */
	enemyCounter: 0,
	enemyPositions: [
		{ frame:100, 	y: 200	},
		{ frame:500, 	y: 400	},
		{ frame:700, 	y: 50	},
		{ frame:900, 	y: 300	},
		{ frame:1200, 	y: 100	},
		{ frame:1400, 	y: 50	},
		{ frame:1500, 	y: 400	},
		{ frame:1600, 	y: 200	},
		{ frame:1700, 	y: 400	},
		{ frame:1750, 	y: 50	},
		{ frame:1750, 	y: 200	},
		{ frame:3000, 	y: 60	}
	],
	addEnemy: function()
	{
	
		statistics.addSprite();
		Crafty.e("2D, DOM, player, animate, collision, Enemy, enemySprite, health")
			.attr({
				x: Crafty.viewport.width, 
				y: main.enemyPositions[main.enemyCounter++].y,
				w: 150,
				h: 40,
				z: 1,
				_lastBombDropped: 0
			})
			.animate("engine_on", 0, 0, 2)
			.origin("center")
			.bind("enterframe", function() 
			{
				
				// Play animation.
				if (!this.isPlaying()) this.animate("engine_on", 25);

				// If damaged, add smoke.
				if (this._mana < 75 && Crafty.frame() % 50 == 0)
				{
					main.addSmoke(this.x, this.y);
				}
				if (this._mana < 50 && (Crafty.frame() + 25) % 50 == 0)
				{
					main.addSmoke(this.x, this.y);
				}
				if (this._mana < 25 && (Crafty.frame() + 12) % 25 == 0)
				{
					main.addSmoke(this.x, this.y);
				}

				// Move plane.
				this.x--;

				// Destroy if it goes out of bounds.
				if(this._x < - this.w) 
				{
					statistics.destroySprite();
					this.destroy();
				}
					
				var d = new Date();
				if (d.getTime() - this._lastBombDropped > 1000)
				{
					this._lastBombDropped = d.getTime();

					// Drop bomb.
					statistics.addSprite();
					Crafty.e("2D, DOM, color, bomb, collision")
						.attr({
							x: this._x + 30, 
							y: this._y + 30, 
							w: 10, 
							h: 5, 
							xspeed: -1, 
							yspeed: 0
						})
						.color("rgb(0, 0, 0)")
						.bind("enterframe", function() 
						{
						
							// Accelerate.
							if (this.yspeed < 5)
							{
								this.yspeed += 0.2;
							}
							
							// Move.
							this.x += this.xspeed;
							this.y += this.yspeed;

							// Destroy if it goes out of bounds.
							if(this._x > Crafty.viewport.width 
								|| this._x < 0 
								|| this._y > Crafty.viewport.height 
								|| this._y < 0) 
							{
								statistics.destroySprite();
								this.destroy();
							}

						})
						.collision()
						.onHit("ground", function(collisionData)
						{

							// Add explosion.
							main.addExplosion(this.x - 80, this.y - 40);

							statistics.destroySprite();
							this.destroy();
						})
						.onHit("house", function(collisionData)
						{

							// Add explosion.
							main.addExplosion(this.x - 80, this.y - 40);

							// Delete house.
							if(collisionData) 
							{
								for(var i = 0; i < collisionData.length; i++) 
								{
									collisionData[i].obj.destroy();
								}
							}

							statistics.destroySprite();
							this.destroy();
						});				
				}
				
			})
			.collision()
			.onHit("bullet", function(collisionData) 
			{
			
				// Reduce health.
				this.hurt(20);
				
				// Delete bullet.
				if(collisionData) 
				{
					for(var i = 0; i < collisionData.length; i++) 
					{
						statistics.destroySprite();
						collisionData[i].obj.destroy();
					}
    			}
    			
			})
			.bind("die", function(e) 
			{

				// Add explosion.
				main.addExplosion(this.x, this.y);

					statistics.destroySprite();
				this.destroy();
			});					

	},
	
	addSmoke: function(x, y)
	{

		var id, params;

		statistics.addSprite();
	
		// Add explosions.
		id = "smoke_" + Math.round(Math.random() * 1000);
		params = {}; params[id] = [0, 0];
		Crafty.sprite(40, "images/tests/spitfire/smoke-frames.png", params);
		Crafty.e("2D, DOM, animate, " + id)
			.attr({
				x: x, 
				y: y, 
				w: 40,
				h: 40,
				z: 1,
				_startFrame: Crafty.frame()
			})
			.animate("smoke", 0, 0, 6)
			.origin("center")
			.bind("enterframe", function() 
			{

				if (!this.isPlaying()) 
				{
				
					if (Crafty.frame() - this._startFrame > 300)
					{
						statistics.destroySprite();
						this.destroy();
						return;
					}
				
					this.animate("smoke", 40);
				}
				
				this.rotation += 1;
			});




	},
	
	/** 
	 * Edd explosion to given position.
	 */
	addExplosion: function(x, y)
	{
		var id, params;

		// Add explosions.
		id1 = "explosion_" + Math.round(Math.random() * 1000);
		params = {}; params[id] = [0, 0];
		Crafty.sprite(64, "images/tests/spitfire/explosion-frames.png", params);
		Crafty.e("2D, DOM, animate, explosion, " + id)
			.attr({ x: x, y: y, w: 64, h: 64, z: 1})
			.explosion(0);
			
		id1 = "explosion_" + Math.round(Math.random() * 1000);
		params = {}; params[id] = [0, 0];
		Crafty.sprite(64, "images/tests/spitfire/explosion-frames.png", params);
		Crafty.e("2D, DOM, animate, explosion, " + id)
			.attr({ x: x + 50, y: y + 20, w: 64, h: 64, z: 1})
			.explosion(10);

		id1 = "explosion_" + Math.round(Math.random() * 1000);
		params = {}; params[id] = [0, 0];
		Crafty.sprite(64, "images/tests/spitfire/explosion-frames.png", params);
		Crafty.e("2D, DOM, animate, explosion, " + id)
			.attr({ x: x + 100, y: y + 5, w: 64, h: 64, z: 1})
			.explosion(25);	

		statistics.addSprite();
		Crafty.e("2D, DOM, animate, part1Sprite")
			.attr({ x: x, y: y, w: 60, h: 60, z: 1, _ySpeed: -7, _xSpeed: -2})
			.animate("part1Animation", 0, 0, 10)
			.animate("part1Animation", 25)
			.origin("center")
			.bind("enterframe", function() 
			{
				if (!this.isPlaying()) this.animate("part1Animation", 90);
				this.rotation -= -10;
				this._ySpeed += 0.2;
				this.x += this._xSpeed;
				this.y += this._ySpeed;

				// Destroy if it goes out of bounds.
				if(this._x > Crafty.viewport.width 
					|| this._x < 0 
					|| this._y > Crafty.viewport.height 
					|| this._y < 0) 
				{
					statistics.destroySprite();
					this.destroy();
				}
				
			});
		
		statistics.addSprite();
		Crafty.e("2D, DOM, animate, part1Sprite")
			.attr({ x: x + 150, y: y, w: 60, h: 60, z: 1, _ySpeed: -5, _xSpeed: 2})
			.animate("part1Animation", 0, 0, 10)
			.animate("part1Animation", 25)
			.origin("center")
			.bind("enterframe", function() 
			{
				if (!this.isPlaying()) this.animate("part1Animation", 90);
				this.rotation -= +10;
				this._ySpeed += 0.2;
				this.x += this._xSpeed;
				this.y += this._ySpeed;

				// Destroy if it goes out of bounds.
				if(this._x > Crafty.viewport.width 
					|| this._x < 0 
					|| this._y > Crafty.viewport.height 
					|| this._y < 0) 
				{
					statistics.destroySprite();
					this.destroy();
				}

			});
			
		statistics.addSprite();
		Crafty.e("2D, DOM, animate, part2Sprite")
			.attr({ x: x + 20, y: y, w: 30, h: 30, z: 1, _ySpeed: -5, _xSpeed: 0.5})
			.animate("part2Animation", 0, 0, 10)
			.animate("part2Animation", 25)
			.origin("center")
			.bind("enterframe", function() 
			{
				if (!this.isPlaying()) this.animate("part2Animation", 100);
				this.rotation -= -5;
				this._ySpeed += 0.2;
				this.x += this._xSpeed;
				this.y += this._ySpeed;

				// Destroy if it goes out of bounds.
				if(this._x > Crafty.viewport.width 
					|| this._x < 0 
					|| this._y > Crafty.viewport.height 
					|| this._y < 0) 
				{
					statistics.destroySprite();
					this.destroy();
				}

			});
		
	},
	
	createGround: function()
	{
	
		// Add grass.
		Crafty.e("2D, DOM, image, ground").attr({ w: 900, h: 60, x: 39, y: 560 }).image("images/tests/spitfire/grass2.png");			
		
		// Add houses.
		Crafty.e("2D, DOM, image, house").attr({ w: 63, h: 71, x: 180, y: 520 }).image("images/tests/spitfire/ground-tree.png");			
		Crafty.e("2D, DOM, image, house").attr({ w: 63, h: 71, x: 220, y: 540 }).image("images/tests/spitfire/ground-tree.png");			
		Crafty.e("2D, DOM, image, house").attr({ w: 100, h: 139, x: 290, y: 460 }).image("images/tests/spitfire/ground-tower.png");			
		Crafty.e("2D, DOM, image, house").attr({ w: 134, h: 73, x: 400, y: 530 }).image("images/tests/spitfire/ground-hangar.png");			
		Crafty.e("2D, DOM, image, house").attr({ w: 134, h: 73, x: 520, y: 550 }).image("images/tests/spitfire/ground-hangar.png");			
		Crafty.e("2D, DOM, image, house").attr({ w: 134, h: 73, x: 670, y: 540 }).image("images/tests/spitfire/ground-hangar.png");			
		Crafty.e("2D, DOM, image, house").attr({ w: 63, h: 71, x: 780, y: 540 }).image("images/tests/spitfire/ground-tree.png");			
		Crafty.e("2D, DOM, image, house").attr({ w: 63, h: 71, x: 810, y: 530 }).image("images/tests/spitfire/ground-tree.png");			
		Crafty.e("2D, DOM, image, house").attr({ w: 63, h: 71, x: 870, y: 520 }).image("images/tests/spitfire/ground-tree.png");			
		
	}

}

/**
 * Record player movements.
 */
var recorder = {

	_reel: [],
	_frame: 0,
	_player: false,
	_playMode: false,
	
	/**
	 * Save current keyboard state.
	 */
	saveState: function(player)
	{

		// If playind, stop recording.
		if (!recorder._playMode)
		{

			recorder._reel[Crafty.frame()] = {
				up: player.isDown(Crafty.keys.UP_ARROW),
				space: player.isDown(Crafty.keys.SPACE),
				right: player.isDown(Crafty.keys.RIGHT_ARROW),
				left: player.isDown(Crafty.keys.LEFT_ARROW)
			};
			
			if (player.isDown(Crafty.keys.ENTER))
			{
				recorder.log();
			}

		}

	},
	
	log: function()
	{
		console.log(JSON.stringify(recorder._reel));
	},
	
	init: function(frame, player, playMode)
	{
		recorder._frame = frame;
		recorder._player = player;
		recorder._playMode = playMode;
	},
	
	isDown: function(keyCode)
	{
	
		// If play mode, use recorded data.
		if (recorder._playMode)
		{

			var currentFrame;

			// Get current state.
			if (typeof(recorder._reel[recorder._frame]) != "undefined")
			{
				currentFrame = recorder._reel[recorder._frame];
			} else {
				return false;
			}
		
			if (keyCode == Crafty.keys.UP_ARROW && currentFrame.up) return true;
			if (keyCode == Crafty.keys.LEFT_ARROW && currentFrame.left) return true;
			if (keyCode == Crafty.keys.RIGHT_ARROW && currentFrame.right) return true;
			if (keyCode == Crafty.keys.SPACE && currentFrame.space) return true;
			
			return false;
			
		} else {
		
			return recorder._player.isDown(keyCode);
		
		}
		
	}
	
}

var statistics = {

	addSprite: function() 
	{ 
		statistics._sprites++; 
	},
	
	destroySprite: function() 
	{ 
		statistics._sprites--; 
	},

	log: function() 
	{ 

		var currentFps = fps;
		var sprites = statistics._sprites;
		statistics._sum += currentFps;
		statistics._count++;
		statistics._averageFps = statistics._sum / statistics._count;
		
		statistics._measurements.push({
			frame: Crafty.frame(),
			sprites: sprites,
			currentFps: currentFps,
			averageFps: statistics._averageFps
		});
	
		$("#spitfire-statistics").html("Currently running " + Math.round(fps) + " frames per seconds (average " + Math.round(statistics._averageFps) + "). There are " + statistics._sprites + " animated sprites on the stage.");
		setTimeout(statistics.log, 500);
	},
	
	_sprites: 0,
	_fps: 0,
	_averageFps: 0,
	_sum: 0,
	_count: 0,
	_measurements: []

};

var pilot = {
	
	element: null,
	
	playAgression: false,
	
	init: function()
	{

		// Add pilot.
		pilot.element =	Crafty.e("2D, DOM, animate, pilotSprite")
					.attr({w: 140, h: 141, x: 31, y: 490, z: 1000})
					.animate("pilotReel", 0, 0, 2)
					.animate("pilotReel", 20)
					.animate("pilotReelAgression", 6, 0, 8)
					.bind("enterframe", function(e) {
						if (
							!this.isPlaying("pilotReel")
							&& !this.isPlaying("pilotReelAgression")
							)
						{
						
							if (pilot.playAgression)
							{
								this.animate("pilotReelAgression", 20);
								pilot.playAgression = false;
							} else {
								this.animate("pilotReel", 20);
							}
						
						}
					});			

	},
	
	fire: function()
	{
		pilot.playAgression = true;
	}

}

