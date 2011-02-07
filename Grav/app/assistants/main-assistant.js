function MainAssistant() {
	this.ctx = null;
	this.gravConstant = 8.14496e-18; // Calculated so that an Earth at 1e-5 times its actual distance (with 1px = 1m) 
                               // has an orbital velocity such at its period is 60s (so G is in pks units) (with no trace).
                               // The "Sun" has its normal mass in kg.
	this.isBounce = true;
	this.isPaused = false;
        this.isButtonPaused = false;
	this.antiFlicker = false;
	this.isRotating = false;
	this.angle = 0;
	this.angularVelocity = 0;
	this.globalOrigin = [0, 0];
	this.bodyCount = 0;
	this.alpha = 1; // check if alpha is supported
	this.screenHeight = 480;
	this.bodies = [];
	this.spaceHeight = 773044.8;
	this.spaceWidth = 515363.2;
	this.spaceX = 0;
	this.spaceY = 0;
    this.scalingWidth = 4800000;
    this.scalingHeight = 3200000;
    this.scalingX = 0;
    this.scalingY = 0;
    this.gestureScale = 0;

    this.newBodyMass = 1e-28;
    this.systemIndex = 2;
}

MainAssistant.prototype.setup = function() {
	this.controller.enableFullScreenMode(true);
	this.keyDownHandlerH = this.keyDownHandler.bind(this);
	this.keyUpHandlerH = this.keyUpHandler.bind(this);
	this.tapHandlerH = this.tapHandler.bind(this);
    this.flickHandlerH = this.flickHandler.bind(this);
    this.gestureHandlerH = this.gestureHandler.bind(this);
    this.gestureStartHandlerH = this.gestureStartHandler.bind(this);
    this.gestureEndHandlerH = this.gestureEndHandler.bind(this);
	this.dragHandlerH = this.dragHandler.bind(this);
	this.dragStartHandlerH = this.dragStartHandler.bind(this);
	this.dragEndHandlerH = this.dragEndHandler.bind(this);
	this.stageActivateHandlerH = this.stageActivateHandler.bind(this);
	this.stageDeactivateHandlerH = this.stageDeactivateHandler.bind(this);
	this.calculateOrbitBind = this.calculateOrbit.bind(this);
    this.optionTapHandlerH = this.optionTapHandler.bind(this);
    this.playTapHandlerH = this.playTapHandler.bind(this);
};

MainAssistant.prototype.activate = function(event) {
	this.screenHeight = Mojo.Environment.DeviceInfo.screenHeight;
	if (this.screenHeight == 400) {
	    this.controller.get('canvas400').style.display = 'block';
	    this.ctx = this.controller.get('canvas400').getContext('2d');
	} else if (this.screenHeight == 480) {
	    this.controller.get('canvas480').style.display = 'block';
	    this.ctx = this.controller.get('canvas480').getContext('2d');
	}
	this.spaceHeight = this.screenHeight * 1610.51;
	Mojo.Event.listen(this.controller.document, Mojo.Event.keydown, this.keyDownHandlerH, true);
	Mojo.Event.listen(this.controller.document, Mojo.Event.keyup, this.keyUpHandlerH, true);
	var canvasid = 'canvas400';
    if (this.screenHeight == 400) {
		canvasid = 'canvas400';
    } else if (this.screenHeight == 480) {
		canvasid = 'canvas480';
    }
	this.controller.listen(this.controller.get(canvasid), Mojo.Event.flick, this.flickHandlerH, true);
	this.controller.listen(this.controller.get(canvasid), 'gesturechange', this.gestureHandlerH, true);
	this.controller.listen(this.controller.get(canvasid), 'gesturestart', this.gestureStartHandlerH, true);
	this.controller.listen(this.controller.get(canvasid), 'gestureend', this.gestureEndHandlerH, true);
	this.controller.listen(this.controller.get(canvasid), Mojo.Event.dragging, this.dragHandlerH, true);
	this.controller.listen(this.controller.get(canvasid), Mojo.Event.dragStart, this.dragStartHandlerH, true);
	this.controller.listen(this.controller.get(canvasid), Mojo.Event.dragEnd, this.dragEndHandlerH, true);
	this.controller.listen(this.controller.get(canvasid), Mojo.Event.tap, this.tapHandlerH, true);
	this.controller.listen(this.controller.document, Mojo.Event.stageActivate, this.stageActivateHandlerH, true);
	this.controller.listen(this.controller.document, Mojo.Event.stageDeactivate, this.stageDeactivateHandlerH, true);
    this.controller.listen(this.controller.get('options_btn'), Mojo.Event.tap, this.optionTapHandlerH, true);
    this.controller.listen(this.controller.get('play_btn'), Mojo.Event.tap, this.playTapHandlerH, true);
	this.loadBodies(this.systemIndex);
	this.calculateOrbit();
};

MainAssistant.prototype.optionTapHandler = function(event) {
    Mojo.Log.info("TAPPED THE OPTION BUTTON");
    var optionsModel = [
        {
            label: "Toggle Trace",
            command: "toggle-trace"
        },
        {
            label: "Toggle Bounce",
            command: "toggle-bounce"
        },
        {
            label: "Rotate Frame",
            command: "rotate-frame"
        },
        {
            label: "Toggle Body Sizes",
            command: "toggle-mass"
        },
        {
            label: "Load System",
            command: "",
            items: [
            {
                label: "Two-Body",
                command: "load-twobody"
            },
            {
                label: "Sun-Jupiter",
                command: "load-sunjupiter"
            },
            {
                label: "Four-Body",
                command: "load-fourbody"
            },
            {
                label: "Pyramid",
                command: "load-pyramid"
            },
            {
                label: "Newton's Gravity Cradle",
                command: "load-cradle"
            }
            ]
        },
        {
            label: "Empty Space",
            command: "empty-space"
        }
    ];
    if (this.alpha < 1) {
        optionsModel[0].chosen = true;
    }
    if (this.isBounce) {
        optionsModel[1].chosen = true;
    }
    if (this.isRotating) {
        optionsModel[2].chosen = true;
    }
    this.isPaused = true;

    this.controller.popupSubmenu({
        onChoose: this.optionTapAction,
        placeNear: event.target,
        popupClass: 'popup-option',
        items: optionsModel
    });
    event.stop();
    event.stopPropagation();
    return false;
}

MainAssistant.prototype.optionTapAction = function(selection) {
    Mojo.Log.info("SELECTED OPTION: " + selection);
    switch (selection) {
        case 'toggle-trace':
            if (this.alpha < 1) {
                this.alpha = 1;
            } else {
                this.alpha = .05
            }
            break;
        case 'toggle-bounce':
            this.isBounce = !this.isBounce;
            break;
        case 'rotate-frame':
            this.isRotating = !this.isRotating;
            break;
        case 'toggle-mass':
            this.newBodyMass = 1/this.newBodyMass;
            break;
        case 'load-system':
            this.systemIndex++;
            if (this.systemIndex > 4) {
                this.systemIndex = 0;
            }
            this.loadBodies(this.systemIndex);
            break;
        case 'empty-space':
            this.loadBodies(-1);
            break;
        case 'load-twobody':
            this.loadBodies(0);
            break;
        case 'load-sunjupiter':
            this.loadBodies(1);
            break;
        case 'load-fourbody':
            this.loadBodies(2);
            break;
        case 'load-pyramid':
            this.loadBodies(3);
            break;
        case 'load-cradle':
            this.loadBodies(4);
            break;
        default:
            break;
    }
    if (!this.isButtonPaused) {
        this.isPaused = false;
        this.calculateOrbit();
    }
}

MainAssistant.prototype.playTapHandler = function(event) {
    if (this.isPaused) {
        this.isPaused = false;
        this.isButtonPaused = false;
        this.controller.get('play_btn').removeClassName('play').addClassName('pause');
	this.calculateOrbit();
    } else {
        this.isPaused = true;
        this.isButtonPaused = true;
        this.controller.get('play_btn').removeClassName('pause').addClassName('play');
    }
    event.stop();
    event.stopPropagation();
    return false;
}

MainAssistant.prototype.keyDownHandler = function(event) {
    //Mojo.Log.info('KEY EVENT: %j', event.originalEvent);
    var ek = event.originalEvent.keyCode;
    Mojo.Log.info('PRESSED KEY: ' + ek);
    var isW = ((ek == Mojo.Char.w) || (ek == Mojo.Char.w + 32));
    var isA = ((ek == Mojo.Char.a) || (ek == Mojo.Char.a + 32));
    var isS = ((ek == Mojo.Char.s) || (ek == Mojo.Char.s + 32));
    var isD = ((ek == Mojo.Char.d) || (ek == Mojo.Char.d + 32));
    var isI = ((ek == Mojo.Char.i) || (ek == Mojo.Char.i + 32));
    var isO = ((ek == Mojo.Char.o) || (ek == Mojo.Char.o + 32));
    var isP = ((ek == Mojo.Char.p) || (ek == Mojo.Char.p + 32));
    var isB = ((ek == Mojo.Char.b) || (ek == Mojo.Char.b + 32));
    var isT = ((ek == Mojo.Char.t) || (ek == Mojo.Char.t + 32));
    var isM = ((ek == Mojo.Char.m) || (ek == Mojo.Char.m + 32));
    var isL = ((ek == Mojo.Char.l) || (ek == Mojo.Char.l + 32));
	var isR = ((ek == Mojo.Char.r) || (ek == Mojo.Char.r + 32));
    // transform the canvas based on movement/zoom
    this.spaceX += this.spaceWidth * ((-(isI) * (45 / 990)) || (+(isO) * (45 / 900)) || ((-(isD) || (+(isA))) * (1 / 30)));
    this.spaceY += this.spaceHeight * (((-(isI) || +(isO)) * (45 / 990)) || ((-(isS) || (+(isW))) * (1 / 30)));
    this.spaceWidth *= (+(isO) * 1.10) || (+(isI) * (90 / 99)) || 1;
    this.spaceHeight *= (+(isO) * 1.10) || (+(isI) * (90 / 99)) || 1;

    if (this.isPaused && (isI || isO || isD || isA || isW || isS)) {
        var scale = this.spaceWidth / 320;
        this.ctx.fillStyle = 'rgb(0,0,0)';
        this.ctx.fillRect(0, 0, 320, this.screenHeight);
        for (var i = this.bodyCount; i--;) {
            var radius = this.bodies[i].radius / scale;
            var position = this.bodies[i].position.add([this.spaceX, this.spaceY]).multiply(1/scale);
            this.drawBody(position[0], position[1], radius, this.bodies[i].color, this.ctx);
        }
    }

    // increase/decrease trace length
    this.alpha *= (.5 * +(isM)) || (2 * +(isL)) || 1;
    if (this.alpha > 1) {
        this.alpha = 1
    }
    if (this.alpha < 0.001) {
        this.alpha = 0.001
    }
    // toggle trace
    if (isT) {
        if (this.alpha < 1) {
            this.alpha = 1;
        } else {
            this.alpha = .05
        }
    }
    // pause
    if (isP) {
        this.playTapHandler(event);
    }
    // toggle bounce
    if (isB) {
        this.isBounce = !this.isBounce;
    }
	// toggle rotating reference frame
    if (isR) {
		this.isRotating = !this.isRotating;
		//document.getElementById('rotating').innerHTML = (isRotating && 'On') || 'Off';
    }

    if (ek == 32) { // Spacebar
        this.systemIndex++;
        if (this.systemIndex > 4) {
            this.systemIndex = 0;
        }
        this.loadBodies(this.systemIndex);
    }
    if (ek == 17) { // SYM button
        this.newBodyMass = 1/this.newBodyMass;
    }
    switch (ek) {
		// 48 = 0 (orange+0), 49 = 1, etc.
        case 49:
            this.loadBodies(0);
            break;
        case 50:
            this.loadBodies(1);
            break;
        case 51:
            this.loadBodies(2);
            break;
        case 52:
            this.loadBodies(3);
            break;
        case 53:
            this.loadBodies(4);
            break;
			/*
        case 53:
            this.loadBodies(5);
            break;
        case 54:
            this.loadBodies(6);
            break;
        case 55:
            this.loadBodies(7);
            break;
        case 56:
            this.loadBodies(8);
            break;
        case 57:
            this.loadBodies(9);
            break;
			*/
        default:
            break;
    }
}

MainAssistant.prototype.keyUpHandler = function(event) {
}

MainAssistant.prototype.flickHandler = function(event) {
    // should target velocities ranging from 500 to 3500 in increments of 500
    // to traverse from one part of the space to another requires 30 clicks
    // current range allows 6 increments of 500
    // each increment of flick should allow for 5 clicks
    var x = event.velocity.x;
    var y = event.velocity.y;
    Mojo.Log.info('FLICK EVENT VELOCITY X: ' + x);
    Mojo.Log.info('FLICK EVENT VELOCITY Y: ' + y);
    var magnitudeX = Math.floor(Math.abs(x) / 500);
    var magnitudeY = Math.floor(Math.abs(y) / 500);
    if (magnitudeX > 0) {
        if (magnitudeX > 6) {
            magnitudeX = 6;
        }
        this.spaceX += this.spaceWidth * ((-(x < 0) || (+(x > 0))) * (5 * magnitudeX / 30));
    }
    if (magnitudeY > 0) {
        if (magnitudeY > 6) {
            magnitudeY = 6;
        }
        this.spaceY += this.spaceHeight * ((-(y < 0) || (+(y > 0))) * (5 * magnitudeY / 30));
    }
    if (this.isPaused && (magnitudeX > 0 || magnitudeY > 0)) {
        var scale = this.spaceWidth / 320;
        this.ctx.fillStyle = 'rgb(0,0,0)';
        this.ctx.fillRect(0, 0, 320, this.screenHeight);
        for (var i = this.bodyCount; i--;) {
            var radius = this.bodies[i].radius / scale;
            var position = this.bodies[i].position.add([this.spaceX, this.spaceY]).multiply(1/scale);
            this.drawBody(position[0], position[1], radius, this.bodies[i].color, this.ctx);
        }
    }
    event.stop();
    event.stopPropagation();
    return false;
}

MainAssistant.prototype.gestureHandler = function(event) {
    //Mojo.Log.info('GESTURE EVENT TRIGGERED: %j', event);
    Mojo.Log.info('GESTURE CHANGE TRIGGERED: ' + event.scale);
    // listen for change in gesture scale
    // should probably limit from .2 to 4 
    // scale < 1 is out, scale > 1 is in
    // when gesture changes by more than .20, update scale
    // scales by 8 clicks in either direction (.1 change out, .375 change in)
    var change = event.scale - this.gestureScale; // greater than 0 means zooming in
    this.gestureScale = event.scale;
    /*
    this.scalingWidth = this.spaceWidth/event.scale;
    this.scalingHeight = this.spaceHeight/event.scale;
    */
    this.spaceWidth = this.scalingWidth/event.scale;
    this.spaceHeight = this.scalingHeight/event.scale;
    /*
    this.spaceX = this.scalingX + (this.scalingWidth * ((-(change > 0) || (+(change < 0))));
    this.spaceY = this.scalingY + (this.scalingHeight * ((-(change > 0) || +(change < 0) * (1/(event.scale*20)))));
    */
    /*
    if (Math.abs(change) > .2) {
        var magnitudeChange = Math.floor(Math.abs(change) / .2);
        for (var i = 0; i < magnitudeChange; i++) {
            this.spaceX += this.spaceWidth * ((-(change > 0) * (45 / 990)) || (+(change < 0) * (45 / 900)));
            this.spaceY += this.spaceHeight * ((-(change > 0) || +(change < 0) * (45/990)))
            this.spaceWidth *= (+(change < 0) * 1.10) || (+(change > 0) * (90/99)) || 1;
            this.spaceHeight *= (+(change < 0) * 1.10) || (+(change > 0) * (90/99)) || 1;
        }
        if (this.isPaused) {
            var scale = this.spaceWidth / 320;
            this.ctx.fillStyle = 'rgb(0,0,0)';
            this.ctx.fillRect(0, 0, 320, this.screenHeight);
            for (var i = this.bodyCount; i--;) {
                var radius = this.bodies[i].radius / scale;
                var position = this.bodies[i].position.add([this.spaceX, this.spaceY]).multiply(1/scale);
                this.drawBody(position[0], position[1], radius, this.bodies[i].color, this.ctx);
            }
        }
    }
    */
    event.stop();
    event.stopPropagation();
    return false;
}

MainAssistant.prototype.gestureStartHandler = function(event) {
    //Mojo.Log.info('GESTURE START EVENT TRIGGERED: %j', event);
    Mojo.Log.info('GESTURE START TRIGGERED: ' + event.scale);
    this.gestureScale = event.scale;
    this.scalingHeight = this.spaceHeight;
    this.scalingWidth = this.spaceWidth;
    this.scalingX = this.spaceX;
    this.scalingY = this.spaceY;
    event.stop();
    event.stopPropagation();
    return false;
}

MainAssistant.prototype.gestureEndHandler = function(event) {
    //Mojo.Log.info('GESTURE END EVENT TRIGGERED: %j', event);
    Mojo.Log.info('GESTURE END TRIGGERED');
    this.gestureScale = 0;
    /*
    this.spaceHeight = this.scalingHeight;
    this.spaceWidth = this.scalingWidth;
    this.spaceX = this.scalingX;
    this.spaceY = this.scalingY;
    */
    event.stop();
    event.stopPropagation();
    return false;
}

MainAssistant.prototype.dragHandler = function(event) {
	//Mojo.Log.info("DRAGGING HANDLER TRIGGERED: %j", event);
	/*
	for (var i in event) {
		Mojo.Log.info("PROPERTY OF THE DRAG START EVENT: " + i);
	}
	*/

	this.spaceX = this.dragX - (this.spaceWidth * ((this.dragStartX - Event.pointerX(event.move)) / 320));
	this.spaceY = this.dragY - (this.spaceHeight * ((this.dragStartY - Event.pointerY(event.move)) / this.screenHeight));

    if (this.isPaused) {
        var scale = this.spaceWidth / 320;
        this.ctx.fillStyle = 'rgb(0,0,0)';
        this.ctx.fillRect(0, 0, 320, this.screenHeight);
        for (var i = this.bodyCount; i--;) {
            var radius = this.bodies[i].radius / scale;
            var position = this.bodies[i].position.add([this.spaceX, this.spaceY]).multiply(1/scale);
            this.drawBody(position[0], position[1], radius, this.bodies[i].color, this.ctx);
        }
    }
    event.stop();
    event.stopPropagation();
    return false;
}

MainAssistant.prototype.dragStartHandler = function(event) {
	//Mojo.Log.info("DRAG START HANDLER TRIGGERED: %j", event);
	// CHECK THE DISTANCE PROPERTY HERE
	this.dragX = this.spaceX;
	this.dragY = this.spaceY;
	this.dragStartX = Event.pointerX(event.move);
	this.dragStartY = Event.pointerY(event.move);
}

MainAssistant.prototype.dragEndHandler = function(event) {
	//Mojo.Log.info("DRAG END HANDLER TRIGGERED: %j", event);
    event.stop();
    event.stopPropagation();
    return false;
}

MainAssistant.prototype.tapHandler = function(event) {
    Mojo.Log.info("CALLED THE TAP HANDLER FOR THE CANVAS");
    var x = event.down.x;
    var y = event.down.y;
    Mojo.Log.info("LOCATION OF TAP: %j", {x: x, y: y});
	//this.spaceX = this.dragX - (this.spaceWidth * ((this.dragStartX - Event.pointerX(event.move)) / 320));
	//this.spaceY = this.dragY - (this.spaceHeight * ((this.dragStartY - Event.pointerY(event.move)) / this.screenHeight));
    
	var pos = [(this.spaceWidth * (x / 320)) - this.spaceX, (this.spaceHeight * (y / this.screenHeight)) - this.spaceY];
	var global = this.globalOrigin.add([this.spaceX, this.spaceY]);
        var angle = this.isRotating ? this.angle : 0;
	pos = pos.subtract(global).rotate(-angle).add(global);
    this.addBody(pos[0], pos[1], this.newBodyMass, false);
}

MainAssistant.prototype.stageActivateHandler = function(event) {
    if (!this.isButtonPaused) {
        // do not automatically start if it has been paused by the user
	this.isPaused = false;
	this.calculateOrbit();
    }
}

MainAssistant.prototype.stageDeactivateHandler = function(event) {
	this.isPaused = true;
}

MainAssistant.prototype.randInt = function(limit) {
	return Math.floor(Math.random() * limit);
}

/*
 * Add vector mathematics methods to the Array prototype (based on methods found in the Sylvester Javascript Library)
 */
Array.prototype.add = function(addarray) {
    //return [this[0] + addarray[0], this[1] + addarray[1], (this[2] || 0) + (addarray[2] || 0)];
    return [this[0] + addarray[0], this[1] + addarray[1]];
}
Array.prototype.subtract = function(subarray) {
    //return [this[0] - subarray[0], this[1] - subarray[1], (this[2] || 0) - (subarray[2] || 0)];
    return [this[0] - subarray[0], this[1] - subarray[1]];
}
Array.prototype.multiply = function(factor) {
    //return [this[0] * factor, this[1] * factor, (this[2] || 0) * factor];
    return [this[0] * factor, this[1] * factor];
}
Array.prototype.multiplyEach = function(multArray) {
    return [this[0] * multArray[0], this[1] * multArray[1]];
}
Array.prototype.dot = function(array2) {
    //return this[0]*array2[0] + this[1]*array2[1] + (this[2] || 0) * (array2[2] || 0);
    return this[0]*array2[0] + this[1]*array2[1];
}
Array.prototype.distanceFrom = function(destArray) {
    //return Math.sqrt(Math.pow(this[0] - destArray[0], 2) + Math.pow(this[1] - destArray[1], 2) + Math.pow((this[2] || 0) - (destArray[2] || 0), 2));
    return Math.sqrt(Math.pow(this[0] - destArray[0], 2) + Math.pow(this[1] - destArray[1], 2));
}
Array.prototype.toUnitVector = function() {
    //var mag = Math.sqrt((this[0] * this[0]) + (this[1] * this[1]) + ((this[2] * this[2]) || 0));
    //return [this[0] / mag, this[1] / mag, (this[2] || 0) / mag];
    var mag = Math.sqrt((this[0] * this[0]) + (this[1] * this[1]));
    return [this[0] / mag, this[1] / mag];
}
Array.prototype.rotate = function(angle) {
    // only used to initialize position of new bodies, see how to adapt to 3d
    var cosangle = Math.cos(angle);
    var sinangle = Math.sin(angle);
    return [(cosangle * this[0]) + (-sinangle * this[1]), (sinangle * this[0]) + (cosangle * this[1])];
}
/*
 * Drawing Functions
 */
MainAssistant.prototype.drawBody = function(x, y, r, color, paper) {
    if (r < 1) {
	r = 1;
    }
    paper.beginPath();
    paper.arc(x, y, r, 0, Math.PI * 2, 1);
    paper.closePath();
    paper.fillStyle = color;
    paper.fill();
}

MainAssistant.prototype.drawLine = function(x, y, oldx, oldy, radius, color, paper) {
    paper.lineWidth = .2*radius;
    paper.lineCap = 'round';
    paper.beginPath();
    paper.moveTo(oldx, oldy);
    paper.lineTo(x, y);
    paper.strokeStyle = color;
    paper.stroke();
}


/*
 * Physics functions
 */

MainAssistant.prototype.derivatives = function(state, derivative, getEnergy, colliders1, colliders2) {
    getEnergy = !!getEnergy;
    var getColliders = !!colliders1;
    var colliders = {};
    var contact = false;
    var totalEnergy = 0;
    // takes a state array, gets the derivatives of the state and stores in derivative
    var bodiesLength = state.length;
    for (var i = bodiesLength; i--;) {
        derivative[i].position = state[i].velocity;
    }
    for (var i = bodiesLength; i--;) {
        for (var j = i; j--;) {
            var diff = state[i].position.subtract(state[j].position);
	    if (getColliders) {
		var radii = this.bodies[i].radius + this.bodies[j].radius;
		if (diff.dot(diff) <= (radii*radii)) {
		    // bodies are touching
                    if (!colliders[i]) {
                        colliders[i] = [];
                    }
                    if (!colliders[j]) {
                        colliders[j] = [];
                    }

                    if (!(colliders[i].indexOf(j) > 0 || colliders[j].indexOf(i) > 0)) {
                        // if the colliders have not been registered yet, use the most massive as the index
                        if (this.bodies[i].mass > this.bodies[j].mass) {
                            colliders[i][colliders[i].length] = j;
                        } else {
                            colliders[j][colliders[j].length] = i;
                        }
                        contact = true;
                    }
		}
	    }
            var dist = state[i].position.distanceFrom(state[j].position)
            var mult = this.gravConstant / (dist * dist * dist);
            var multi = -mult * this.bodies[j].mass;
            var multj = mult * this.bodies[i].mass;
            derivative[i].velocity = derivative[i].velocity.add(diff.multiply(multi));
            derivative[j].velocity = derivative[j].velocity.add(diff.multiply(multj));
            if (getEnergy) {
                totalEnergy -= (this.gravConstant * this.bodies[j].mass * this.bodies[i].mass) / dist;
            }
        }
    }
    if (contact) {
	for (var first in colliders) {
            colliders1[colliders1.length] = +first;
            colliders2[colliders2.length] = colliders[first];
	}
    }
    return totalEnergy;
}

MainAssistant.prototype.calculateOrbit = function() {
    var bodiesLength = this.bodies.length;
    // RK4 derivatives and intermediate
    // This RK4 method adapted from the program Planets by Yaron Minsky (planets.homedns.org)
    var derivative1 = [];
    var derivative2 = [];
    var derivative3 = [];
    var derivative4 = [];
    var yt = [];
    var hh = 0.5; //rk4 half timestep
    var h6 = 1/6;  //rk4 1/6 timestep
    for (var i = bodiesLength; i--;) {
        derivative1[i] = {position:[0,0], velocity:[0,0]};
        derivative2[i] = {position:[0,0], velocity:[0,0]};
        derivative3[i] = {position:[0,0], velocity:[0,0]};
        derivative4[i] = {position:[0,0], velocity:[0,0]};
        yt[i] = {position:[0,0], velocity:[0,0]};
    }
    var massiveColliders = [];
    var smallColliders = [];
    var energy;
    if (this.isBounce) {
        energy = this.derivatives(this.bodies, derivative1, true, massiveColliders, smallColliders); // compute the first derivative for rk4, stored into derivative1, get the gravitational energy
    } else {
        energy = this.derivatives(this.bodies, derivative1, true);
    }
    for (var i = bodiesLength; i--;) {
        yt[i].position = this.bodies[i].position.add(derivative1[i].position.multiply(hh));
        yt[i].velocity = this.bodies[i].velocity.add(derivative1[i].velocity.multiply(hh));
    }
    this.derivatives(yt, derivative2); // compute the second derivative for rk4 using the position and velocity updated from first derivative
    for (var i = bodiesLength; i--;) {
        yt[i].position = this.bodies[i].position.add(derivative2[i].position.multiply(hh));
        yt[i].velocity = this.bodies[i].velocity.add(derivative2[i].velocity.multiply(hh));
    }
    this.derivatives(yt, derivative3);
    for (var i = bodiesLength; i--;) {
        yt[i].position = this.bodies[i].position.add(derivative3[i].position);
        yt[i].velocity = this.bodies[i].velocity.add(derivative3[i].velocity);
        derivative3[i].position = derivative3[i].position.add(derivative2[i].position);
        derivative3[i].velocity = derivative3[i].velocity.add(derivative2[i].velocity);
    }
    this.derivatives(yt, derivative4);
    if (massiveColliders.length > 0) {
        // for colliding
        // adapted from http://www.gamasutra.com/view/feature/3015/pool_hall_lessons_fast_accurate_.php?print=1
        // and
        // http://stackoverflow.com/questions/345838/ball-to-ball-collision-detection-and-handling
        for (var i = massiveColliders.length; i--;) {
            var body1 = this.bodies[massiveColliders[i]];
            for (var j = smallColliders[i].length; j--;) {
                var body2 = this.bodies[smallColliders[i][j]];
                var diff = body1.position.subtract(body2.position);
                var mag = Math.sqrt(diff.dot(diff));
                // minimum translation distance to push bodies apart after intersecting
                var move = diff.multiply((body1.radius+body2.radius-mag)/mag);
                //inverse mass quantities
                var im1 = 1 / body1.mass;
                var im2 = 1 / body2.mass;
                // push-pull them apart based off their mass
                body1.position = body1.position.add(move.multiply(im1/(im1+im2)));
                body2.position = body2.position.subtract(move.multiply(im2/(im1+im2)));
                // impact speed
                var n = diff.toUnitVector();
                var vn = body1.velocity.dot(n) - body2.velocity.dot(n);
                if (vn <= 0) {
                    // collision impulse
                    var impulse = n.multiply((-2 * vn) / (im1 + im2));
                    // change in momentum
                    body1.velocity = body1.velocity.add(impulse.multiply(im1));
                    body2.velocity = body2.velocity.subtract(impulse.multiply(im2));
                }
            }
        }
    }
    bodiesLength = this.bodies.length;
    var scale = this.spaceWidth / 320;
	//if (this.alpha >= 0.001 && this.alpha < 1) {
    if (this.alpha == 1) {
		//this.ctx.fillStyle = 'rgba(0,0,0 ' + this.alpha + ')';
		this.ctx.fillStyle = 'rgb(0,0,0)';
		this.ctx.fillRect(0, 0, 320, this.screenHeight);
	}
    var com = [0, 0];
    var totalMass = 0;
	this.angle += this.angularVelocity;
	this.angle %= 2 * Math.PI;
	var global = this.globalOrigin.add([this.spaceX, this.spaceY]);
    for (var i = bodiesLength; i--;) {
        var firstPosition = this.bodies[i].position;
        this.bodies[i].position = this.bodies[i].position.add((derivative1[i].position.add(derivative4[i].position).add(derivative3[i].position.multiply(2))).multiply(h6));
        this.bodies[i].velocity = this.bodies[i].velocity.add((derivative1[i].velocity.add(derivative4[i].velocity).add(derivative3[i].velocity.multiply(2))).multiply(h6));
        energy += .5 * this.bodies[i].mass * this.bodies[i].velocity.dot(this.bodies[i].velocity);
        var radius = this.bodies[i].radius / scale;
        var position = this.bodies[i].position.add([this.spaceX, this.spaceY]);
		if (this.isRotating) {
			position = position.subtract(global).rotate(this.angle).add(global);
		}
		position = position.multiply(1/scale);
        this.drawBody(position[0], position[1], radius, this.bodies[i].color, this.ctx);
        /*
        if (this.alpha < 1) {
            this.drawLine(position[0], position[1], firstPosition[0], firstPosition[1], radius, this.bodies[i].color, this.ctx);
        }
        */
        com = com.add(position.multiply(this.bodies[i].mass));
        totalMass += this.bodies[i].mass;
    }
    com = com.multiply(1/(totalMass));
    this.drawBody(com[0], com[1], 3, '#fff', this.ctx);
    this.ctx.strokeStyle = '#faa';
    this.ctx.stroke();
    if (this.bodyCount != this.bodies.length) {
        this.bodyCount = this.bodies.length;
        //document.getElementById('bodyCount').innerHTML = 'There are ' + bodyCount + ' bodies.';
    }
    if (!this.isPaused) {
        setTimeout(this.calculateOrbitBind, 16);
    }
}

MainAssistant.prototype.addBody = function(x, y, newMass, randomOrientation) {
    var newRadius = Math.pow((newMass) / 2.50596227828973444312e19, 1/2); // using average density of all planets of 3.1251e3 kg / m
    //newRadius /= 1e5; // 1px = 1e-5 m
    if (newRadius < 6000) {
	newRadius = 6000;
    }
    var newPosition = [x, y];
    var velocity = 0;
    var bodiesLength = this.bodies.length;
    if (bodiesLength > 0) {
        // just using the most massive body (body exerting greatest force), instead of COM, for simplicity
        /*
        var mostMassiveBody = this.bodies[this.bodies.length - 1];
        var massiveIndex = 0;
        var delp = mostMassiveBody.position.subtract(newPosition);
        var massDistance = mostMassiveBody.mass / delp.dot(delp);
        for (var i = bodiesLength - 1; i--;) {
            var delp = this.bodies[i].position.subtract(newPosition);
            var newMassDistance = this.bodies[i].mass / delp.dot(delp);
            if (newMassDistance > massDistance) {
                mostMassiveBody = this.bodies[i];
                massiveIndex = i;
                massDistance = newMassDistance;
            }
        }
        // Get the unit vector from the new body to the most massive body (COM), rotate it 90 degrees (either left or right),
        // multiply the unit vector by the velocity (sqrt(GM / R)) to get the velocity vector, then add the velocity vector
        // from the most massive body to get an orbital velocity vector relative to COM
        */
        var com = [0, 0];
        var vel = [0, 0];
        var totalMass = 0;
        for (var i = 0; i < bodiesLength; i++) {
            var mass = this.bodies[i].mass;
            vel = vel.add(this.bodies[i].velocity.multiply(mass));
            com = com.add(this.bodies[i].position.multiply(mass));
            totalMass += mass;
        }
        com = com.multiply(1/totalMass);
        vel = vel.multiply(1/totalMass);
        //velocity = mostMassiveBody.position.subtract(newPosition).toUnitVector().rotate(-Math.PI / 2).multiply(Math.sqrt((this.gravConstant * mostMassiveBody.mass) / mostMassiveBody.position.distanceFrom(newPosition))).add(mostMassiveBody.velocity);
        velocity = com.subtract(newPosition).toUnitVector().rotate(Math.PI / 2).multiply(Math.sqrt((this.gravConstant * totalMass) / com.distanceFrom(newPosition))).add(vel);
        randomOrientation = false;
    } else {
        velocity = [0,0];
    }
    if (typeof(randomOrientation) != 'undefined' && randomOrientation == true) {
        velocity = velocity.rotate(2*Math.PI*Math.random());
    }
    var color = 'rgb(' + (127 + this.randInt(127)) + ',' + (127 + this.randInt(127)) + ',' + (127 + this.randInt(127)) + ')';
    this.bodies[this.bodies.length] = {mass: newMass, velocity: velocity, radius: newRadius, position: newPosition, color:color};
    if (this.isPaused) {
        this.drawBody(x, y, newRadius, color, this.ctx);
    }
}

MainAssistant.prototype.loadBodies = function(id) {
    this.ctx.fillStyle = 'rgb(0,0,0)';
    this.ctx.fillRect(0, 0, 320, this.screenHeight);
	this.angle = 0;
	this.angularVelocity = 0;
	this.globalOrigin = [0, 0];
    switch (id) {
        case 0:
            // two-body system
			this.angle = 0;
			this.angularVelocity = 2 * Math.PI / 1245.40435371695954330138;
			this.globalOrigin = [250000, 300000];
            this.bodies = [{
                velocity: [0, 1009.01932588033218502780],
                position: [50000, 300000],
                radius: 10000,
                mass: 1e29,
                color: '#ff0'},
            {
                velocity: [0, -1009.01932588033218502780],
                position: [450000, 300000],
                radius: 10000,
                mass: 1e29,
                color: '#ff0'}, ];
            break;
        case 1:
            // two-body system
            this.angle = 0;
            this.angularVelocity = 2 * Math.PI / 139.56194206293700933434;
            this.globalOrigin = [255000,300000];
            this.bodies = [{
                velocity: [0, 8.5753931246],
                position: [254809.3418472522, 300000],
                radius: 10000,
                mass: 1.9889e30,
                color: '#ff0'},
            {
                velocity: [0, -8995.5692961461],
                position: [454809.341847252, 300000],
                radius: 5000,
                mass: 1.896e27,
                color: '#ff0'}, 
            {
                velocity: [0, 8879.6940],
                position: [49700.658152748, 300000],
                radius: 1,
                mass: 1e-30,
                color: '#ff0'}, 
            ];
            break;
        case 2:
            // A four-body system with all bodies orbiting the common center of mass, not stable
			            // A four-body system with all bodies orbiting the common center of mass, not stable
            this.angle = 0;
            this.angularVelocity = 2 * Math.PI / 1169.38970105645338634783;
            this.globalOrigin = [300000,300000];
            this.bodies = [{
                //velocity: [0, 1922.34193589967716713965],
                velocity: [0, 1611.913967132568359375],
                position: [0, 300000],
                radius: 6000,
                mass: 1e29,
                color: '#ff0'},
            {
                //velocity: [0, -1922.34193589967716713965],
                velocity: [0, -1611.913967132568359375],
                position: [600000, 300000],
                radius: 6000,
                mass: 1e29,
                color: '#ff0'},
            {
                //velocity: [1922.34193589967716713965, 0],
                velocity: [1611.913967132568359375, 0],
                position: [300000, 600000],
                radius: 6000,
                mass: 1e29,
                color: '#ff0'},
            {
                //velocity: [-1922.34193589967716713965, 0],
                velocity: [-1611.913967132568359375, 0],
                position: [300000, 0],
                radius: 6000,
                mass: 1e29,
                color: '#ff0'}, ];
			break;

        case 3:
            this.bodies = [
// A "static" pyramid as defined by the following bodies will eventually acquire angular momentum
// showing how errors in the integrator can build up to allow non-physical behavior
// Eventually the angular momentum will increase to the point that outer bodies will be flung out
// Pyramid constructed by setting a bottom row of bodies aligned on the x-axis,
// rotating a radius vector [0, r] for bodies of radius r by -Math.PI / 6, multiplying 2,
// then adding the new vector to the position vector of a body, stacking bodies as appropriate
                 {velocity: [0, 0],
                 position: [200000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0],
                 position: [254000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0],
                 position: [308000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0],
                 position: [362000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0],
                 position: [227000, 346765.3718043597],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [281000, 346765.3718043597],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [335000, 346765.3718043597],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [308000, 393530.7436087194],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [254000, 393530.7436087194],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [281000, 440296.1154130791],
                 radius:27000,
                 mass:3e28,
                 color: '#0ff'},

/*
                 {velocity: [0, 3363.39775293444061675927],
                 position: [65000, 346765.3718043597],
                 radius: 6000,
                 mass: 1,
                 color: '#ff0'},

                 {velocity: [0, 3008.31440437258079415438],
                 position: [11000, 346765.3718043597],
                 radius: 6000,
                 mass: 1,
                 color: '#ff0'},
                 */
            ];
            break;
        case 4:
            this.bodies = [
                 {velocity: [0, 0],
                 position: [100000, 300000],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0],
                 position: [1000000, 300000], 
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},
                 
                 {velocity: [0, 0],
                 position: [1054000, 300000], 
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0],
                 position: [1108000, 300000], 
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},
            ];
            break;
        case 5:
        default:
            this.bodies = [];
            break;
    }
    this.bodyCount = this.bodies.length;
    for (var i = this.bodyCount; i--;) {
        this.drawBody(this.bodies[i].position[0], this.bodies[i].position[1], this.bodies[i].radius, this.bodies[i].color, this.ctx);
    }
}

MainAssistant.prototype.deactivate = function(event) {
	Mojo.Event.stopListening(this.controller.document, Mojo.Event.keydown, this.keyDownHandlerH);
	Mojo.Event.stopListening(this.controller.document, Mojo.Event.keyup, this.keyUpHandlerH);
	this.controller.stopListening(this.controller.document, Mojo.Event.stageActivate, this.stageActivateHandlerH);
	this.controller.stopListening(this.controller.document, Mojo.Event.stageDeactivate, this.stageDeactivateHandlerH);
    this.controller.stopListening(this.controller.get('options_btn'), Mojo.Event.tap, this.optionTapHandlerH);
    this.controller.stopListening(this.controller.get('play_btn'), Mojo.Event.tap, this.playTapHandlerH);
    var canvasid = 'canvas400';
    if (this.screenHeight == 400) {
        canvasid = 'canvas400';
    } else if (this.screenHeight == 480) {
        canvasid = 'canvas480';
    }
    this.controller.stopListening(this.controller.get(canvasid), Mojo.Event.flick, this.flickHandlerH);
	this.controller.stopListening(this.controller.get(canvasid), Mojo.Event.tap, this.tapHandlerH);
	this.controller.stopListening(this.controller.get(canvasid), 'gesturechange', this.gestureHandlerH, true);
	this.controller.stopListening(this.controller.get(canvasid), 'gesturestart', this.gestureStartHandlerH, true);
	this.controller.stopListening(this.controller.get(canvasid), 'gestureend', this.gestureEndHandlerH, true);
	this.controller.stopListening(this.controller.get(canvasid), Mojo.Event.dragging, this.dragHandlerH, true);
	this.controller.stopListening(this.controller.get(canvasid), Mojo.Event.dragStart, this.dragStartHandlerH, true);
	this.controller.stopListening(this.controller.get(canvasid), Mojo.Event.dragEnd, this.dragEndHandlerH, true);
	this.controller.stopListening(this.controller.get(canvasid), Mojo.Event.tap, this.tapHandlerH, true);
};

MainAssistant.prototype.cleanup = function(event) {
};
