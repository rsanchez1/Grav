// Grav - Canvas
// An orbit simulation program using Canvas for animations
// By: Roberto Sanchez
// Inspired by the program Planets by Yaron Minsky (planets.homedns.org)

/*
 * Some Utility Functions
 */
function debug(e) {
    if (window.console && console.log) {
        // Firebug
        return console.log(e);
    }
    if (window.opera && opera.postError) {
        // Dragonfly
        return opera.postError(e);
    }
    if (window.console && console.debug) {
        // Webkit
        return console.debug(e);
    }
}
function randInt(limit) {
    return Math.floor(Math.random() * limit);
}

function getHeight() {
    return Math.max(document.documentElement.scrollHeight, document.documentElement.clientHeight);
}

function getWidth() {
    return document.documentElement.clientWidth;
}
/*
 * Add vector mathematics methods to the Array prototype (based on methods found in the Sylvester Javascript Library)
 */
Array.prototype.add = function(addarray) {
    //return [this[0] + addarray[0], this[1] + addarray[1], (this[2] || 0) + (addarray[2] || 0)];
    return [this[0] + addarray[0], this[1] + addarray[1], this[2] + addarray[2]];
}
Array.prototype.subtract = function(subarray) {
    //return [this[0] - subarray[0], this[1] - subarray[1], (this[2] || 0) - (subarray[2] || 0)];
    return [this[0] - subarray[0], this[1] - subarray[1], this[2] - subarray[2]];
}
Array.prototype.multiply = function(factor) {
    //return [this[0] * factor, this[1] * factor, (this[2] || 0) * factor];
    return [this[0] * factor, this[1] * factor, this[2] * factor];
}
Array.prototype.multiplyEach = function(multArray) {
    return [this[0] * multArray[0], this[1] * multArray[1], (this[2] || 0) * (multArray[2] || 0)];
}
Array.prototype.dot = function(array2) {
    //return this[0]*array2[0] + this[1]*array2[1] + (this[2] || 0) * (array2[2] || 0);
    return this[0]*array2[0] + this[1]*array2[1] + this[2]*array2[2];
}
Array.prototype.distanceFrom = function(destArray) {
    //return Math.sqrt(Math.pow(this[0] - destArray[0], 2) + Math.pow(this[1] - destArray[1], 2) + Math.pow((this[2] || 0) - (destArray[2] || 0), 2));
    return Math.sqrt(Math.pow(this[0] - destArray[0], 2) + Math.pow(this[1] - destArray[1], 2) + Math.pow(this[2] - destArray[2], 2));
}
Array.prototype.toUnitVector = function() {
    //var mag = Math.sqrt((this[0] * this[0]) + (this[1] * this[1]) + ((this[2] * this[2]) || 0));
    //return [this[0] / mag, this[1] / mag, (this[2] || 0) / mag];
    var mag = Math.sqrt((this[0] * this[0]) + (this[1] * this[1]) + (this[2] * this[2]));
    return [this[0] / mag, this[1] / mag, this[2] / mag];
}
Array.prototype.rotate = function(angle) {
    // only used to initialize position of new bodies, see how to adapt to 3d
    var cosangle = Math.cos(angle);
    var sinangle = Math.sin(angle);
    return [(cosangle * this[0]) + (-sinangle * this[1]), (sinangle * this[0]) + (cosangle * this[1]), this[2]];
}
/*
 * Drawing Functions
 */
function drawBody(x, y, r, color, paper) {
    paper.beginPath();
    paper.arc(x, y, r, 0, Math.PI * 2, 1);
    paper.closePath();
    paper.fillStyle = color;
    paper.fill();
}

function drawLine(x, y, oldx, oldy, radius, color, paper) {
    paper.lineWidth = .2*radius;
    paper.lineCap = 'round';
    paper.beginPath();
    paper.moveTo(oldx, oldy);
    paper.lineTo(x, y);
    paper.strokeStyle = color;
    paper.stroke();
}
/*
 * Some Javascript event functions
 */
function addBodyClick(ev) {
    var x = 0;
    var y = 0;
    if (typeof(ev.layerX) == 'undefined') {
        x = ev.offsetX;
        y = ev.offsetY;
    } else {
        x = ev.layerX;
        y = ev.layerY;
    }
    var randomOrientation = false;
    if (!!ev.shiftKey) {
        randomOrientation = true;
    }
    var scale = Math.abs(600/(600+zadd));
    addBody((x / scale) - xadd, (y / scale) - yadd, +document.getElementById('newmass').value, randomOrientation);
}

function handleArrowEvents(ev) {
    var ek = ev.which;
    xdeg += (-(ek == 37) || +(ek == 39)) * 1/36;
    ydeg += (-(ek == 40) || +(ek == 38)) * 1/36;
}

function pageEvents(ev) {
    var ek = ev.which;
    var willReset = false;
    var scale = Math.abs((600)/(600+zadd));
    // transform the canvas based on movement/zoom
    xadd += windowWidth * (((-(ek == 105) || +(ek == 111)) * (45/(900*scale))) || ((-(ek == 100) || +(ek == 97)) / (scale * 30)));
    //rectDimensions[0] += rectDimensions[2] * ((-(ek == 105) * (45 / 990)) || (+(ek == 111) * (45 / 900)) || ((-(ek == 100) || (+(ek == 97))) * (1 / 30)));
    yadd += windowHeight * (((-(ek == 105) || +(ek == 111)) * (45/(900*scale))) || ((-(ek == 115) || +(ek == 119)) / (scale * 30)));
    var add = .1*zadd;
    if (add < 1000) {add = 1000;}
    zadd += (-(ek == 105) || +(ek == 111)) * add;
    willReset = ek == 111 || ek == 105 || ek == 115 || ek == 100 || ek == 119 || ek == 97 || ek == 107 || ek == 117 || ek == 106 || ek == 105;

    // increase/decrease trace length
    alpha *= (.5 * +(ek == 109)) || (2 * +(ek == 108)) || 1;
    if (alpha > 1) {
        alpha = 1
    }
    if (alpha < 0.001) {
        alpha = 0.001
    }
    // toggle trace
    if (ek == 116) {
        if (alpha < 1) {
            alpha = 1;
        } else {
            alpha = .05
        }
    }
    // pause
    if (ek == 112) {
        isPaused = !isPaused;
        if (!isPaused) {
            calculateOrbit();
        }
    }
    // hide instructions
    if (ek == 113) {
        document.getElementById('instructions').style.display = (document.getElementById('instructions').style.display == 'none' ? 'block' : 'none');
    }
    // toggle flicker
    if (ek == 102) {
        antiFlicker = !antiFlicker;
        document.getElementById('flicker').innerHTML = (antiFlicker && 'Off') || 'On';
    }
    // toggle bounce
    if (ek == 98) {
        isBounce = !isBounce;
        document.getElementById('bounce').innerHTML = (isBounce && 'On') || 'Off';
    }
    resetCanvas(willReset);
}

function resizeWindow() {
    windowWidth = getWidth();
    windowHeight = getHeight();
    paper.canvas.width = windowWidth;
    paper.canvas.height = windowHeight;
    var transition = document.getElementById('transition');
    transition.width = windowWidth;
    transition.height = windowHeight;
    resetCanvas(true);
}

function resetCanvas(willReset) {
    /*
    TODO: REDO ALL OF THIS TO USE ZADD
    var transition = document.getElementById('transition').getContext('2d');
    if (willReset) {
        if (antiFlicker || alpha < 1) {
            transition.drawImage(paper.canvas, 0, 0);
        }
        paper.fillStyle = '#000';
        paper.fillRect(-oldRect[0], -oldRect[1], oldRect[2], oldRect[3]);
    }
    paper.setTransform(1, 0, 0, 1, 0, 0);
    var scaleWidth = windowWidth / rectDimensions[2];
    var scaleHeight = windowHeight / rectDimensions[3];
    paper.scale(scaleWidth, scaleHeight);
    paper.translate(rectDimensions[0], rectDimensions[1]);
    if (willReset && (antiFlicker || alpha < 1)) {
        paper.drawImage(transition.canvas, -oldRect[0], -oldRect[1], oldRect[2], oldRect[3]);
    }
    if (willReset && isPaused) {
        for (var i = bodies.length; i--;) {
            drawBody(bodies[i].position[0], bodies[i].position[1], bodies[i].radius, bodies[i].color, paper);
        }
    }
    */
    document.getElementById('viewx').innerHTML = 'X: ' + parseInt(xadd, 10);
    document.getElementById('viewy').innerHTML = 'Y: ' + parseInt(yadd, 10);
    var scale = Math.abs((600)/(600+zadd));
    document.getElementById('viewidth').innerHTML = 'Width: ' + parseInt(windowWidth/scale, 10);
    document.getElementById('viewheight').innerHTML = 'Height: ' + parseInt(windowHeight/scale, 10);
}

function changeBody(ev) {
    loadBodies(+ev.target.value);
    this.blur();
}

function getUrl() {
    window.location.hash = JSON.stringify(bodies);
}

function handleScroll(e) {
    e = e ? e : window.event;
    var wheelData = e.detail ? e.detail * -1 : e.wheelDelta / 40;
    if (wheelData < 0) {
        pageEvents({which:111});
    } else {
        pageEvents({which:105});
    }
    return cancelEvent(e);
}

function cancelEvent(e)
{
    e = e ? e : window.event;
    if(e.stopPropagation) {
        e.stopPropagation();
    }
    if(e.preventDefault) {
        e.preventDefault();
    }
    e.cancelBubble = true;
    e.cancel = true;
    e.returnValue = false;
    return false;
}

/*
 * Physics functions
 */
var gravConstant = 8.14496e-18; // Calculated so that an Earth at 1e-5 times its actual distance (with 1px = 1m) 
                               // has an orbital velocity such at its period is 60s (so G is in pks units) (with no trace).
                               // The "Sun" has its normal mass in kg.
function derivatives(state, derivative, getEnergy, colliders1, colliders2) {
    getEnergy = !!getEnergy;
    getColliders = !!colliders1;
    colliders = {contact:0};
    var totalEnergy = 0;
    // takes a state array, gets the derivatives of the state and stores in derivative
    var bodiesLength = state.length;
    for (var i = bodiesLength; i--;) {
        derivative[i].position = state[i].velocity;
    }
    for (var i = bodiesLength; i--;) {
        for (var j = i; j--;) {
            var diff = state[i].position.subtract(state[j].position);
            //debug('Diff: ' + diff.toString());
	    if (getColliders) {
		var radii = bodies[i].radius + bodies[j].radius;
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
                        if (bodies[i].mass > bodies[j].mass) {
                            colliders[i][colliders[i].length] = j;
                        } else {
                            colliders[j][colliders[j].length] = i;
                        }
                        colliders.contact++;
                    }
		}
	    }
            var dist = state[i].position.distanceFrom(state[j].position)
            //debug('Dist: ' + dist);
            var mult = gravConstant / (dist * dist * dist);
            //debug('Mult: ' + mult);
            var multi = -mult * bodies[j].mass;
            var multj = mult * bodies[i].mass;
            derivative[i].velocity = derivative[i].velocity.add(diff.multiply(multi));
            //debug('Derivative I: ' + derivative[i].velocity.toString());
            derivative[j].velocity = derivative[j].velocity.add(diff.multiply(multj));
            //debug('Derivative J: ' + derivative[j].velocity.toString());
            if (getEnergy) {
                totalEnergy -= (gravConstant * bodies[j].mass * bodies[i].mass) / dist;
            }
        }
    }
    if (colliders.contact > 0) {
	for (var first in colliders) {
	    if (first != 'contact') {
		colliders1[colliders1.length] = +first;
	        colliders2[colliders2.length] = colliders[first];
	    }
	}
    }
    return totalEnergy;
}

function calculateOrbit() {
    var bodiesLength = bodies.length;
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
        derivative1[i] = {position:[0,0,0], velocity:[0,0,0]};
        derivative2[i] = {position:[0,0,0], velocity:[0,0,0]};
        derivative3[i] = {position:[0,0,0], velocity:[0,0,0]};
        derivative4[i] = {position:[0,0,0], velocity:[0,0,0]};
        yt[i] = {position:[0,0,0], velocity:[0,0,0]};
    }
    var massiveColliders = [];
    var smallColliders = [];
    var energy;
    if (isBounce) {
        energy = derivatives(bodies, derivative1, true, massiveColliders, smallColliders); // compute the first derivative for rk4, stored into derivative1, get the gravitational energy
    } else {
        energy = derivatives(bodies, derivative1, true);
    }
    //debug(bodies[0].position.toString());
    //energyText.firstChild.textContent = 'U: ' + energy;
    for (var i = bodiesLength; i--;) {
        yt[i].position = bodies[i].position.add(derivative1[i].position.multiply(hh));
        yt[i].velocity = bodies[i].velocity.add(derivative1[i].velocity.multiply(hh));
    }
    derivatives(yt, derivative2); // compute the second derivative for rk4 using the position and velocity updated from first derivative
    //debug(bodies[0].position.toString());
    for (var i = bodiesLength; i--;) {
        yt[i].position = bodies[i].position.add(derivative2[i].position.multiply(hh));
        yt[i].velocity = bodies[i].velocity.add(derivative2[i].velocity.multiply(hh));
    }
    derivatives(yt, derivative3);
    //debug(bodies[0].position.toString());
    for (var i = bodiesLength; i--;) {
        yt[i].position = bodies[i].position.add(derivative3[i].position);
        yt[i].velocity = bodies[i].velocity.add(derivative3[i].velocity);
        derivative3[i].position = derivative3[i].position.add(derivative2[i].position);
        derivative3[i].velocity = derivative3[i].velocity.add(derivative2[i].velocity);
    }
    derivatives(yt, derivative4);
    //debug(bodies[0].position.toString());
    if (alpha >= 0.001) {
        paper.fillStyle = 'rgba(0,0,0,' + alpha + ')';
        paper.fillRect(0, 0, windowWidth, windowHeight);
    }
    if (massiveColliders.length > 0) {
	// get the new momentum for the massive body, and the new mass
        /*
        // for absorbing
	for (var i = massiveColliders.length; i--;) {
	    var newMass = bodies[massiveColliders[i]].mass + bodies[smallColliders[i]].mass;
    	    var newRadius = Math.pow((newMass) / 2.50596227828973444312e20, 1/2); // using average density of all planets of 3.1251e3 kg / m
    	    //newRadius /= 1e5; // 1px = 1e-5 m
            if (newRadius < 100) {
		newRadius = 100;
	    }
	    var newVelocity = bodies[massiveColliders[i]].velocity.multiply(bodies[massiveColliders[i]].mass).add(bodies[smallColliders[i]].velocity.multiply(bodies[smallColliders[i]].mass)).multiply(1/newMass);
	    bodies[massiveColliders[i]].mass = newMass;
	    bodies[massiveColliders[i]].radius = newRadius;
	    bodies[massiveColliders[i]].velocity = newVelocity;
	}
	// remove the small body and all its derivatives
	var minimum = bodies.length;
	var subtract = 0;
	for (var i = smallColliders.length; i--;) {
	    var index = smallColliders[i];
            if (index < minimum) {
		// the index now references bodies of one lower index
		subtract++;
		minimum = index;
	    } else {
		index -= subtract;
	    }
	    bodies.splice(index, 1);
	    derivative1.splice(index, 1);
	    derivative3.splice(index, 1);
	    derivative4.splice(index, 1);
	}
        */
        // for colliding
        // adapted from http://www.gamasutra.com/view/feature/3015/pool_hall_lessons_fast_accurate_.php?print=1
        // and
        // http://stackoverflow.com/questions/345838/ball-to-ball-collision-detection-and-handling
        for (var i = massiveColliders.length; i--;) {
            var body1 = bodies[massiveColliders[i]];
            for (var j = smallColliders[i].length; j--;) {
                var body2 = bodies[smallColliders[i][j]];
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
    bodiesLength = bodies.length;
    //debug(bodies[0].position.toString());
    //debug('------------------------------');
    //debug(derivative1);
    //debug(derivative2);
    //debug(derivative3);
    //debug(derivative4);
    var scale = Math.abs((600)/(600+zadd));
    var pivx = /*(xadd + (windowWidth / scale)) / 2*/0;
    var pivy = /*(yadd + (windowHeight / scale)) / 2*/0;
    var pivz = /*zadd / 4*/0;
    for (var i = bodiesLength; i--;) {
        var firstPosition = bodies[i].position;
        bodies[i].position = bodies[i].position.add((derivative1[i].position.add(derivative4[i].position).add(derivative3[i].position.multiply(2))).multiply(h6));
        bodies[i].velocity = bodies[i].velocity.add((derivative1[i].velocity.add(derivative4[i].velocity).add(derivative3[i].velocity.multiply(2))).multiply(h6));
        energy += .5 * bodies[i].mass * bodies[i].velocity.dot(bodies[i].velocity);
        /*------------------------------*/
        //if (i == 0) {debug(bodies[i].position.toString());}
        var position = bodies[i].position.slice();
        var xd = position[0] - pivx;
        var yd = position[1] - pivy;
        var zd = position[2] - pivz;
        //if (i == 0) {debug(position.toString());}
        var zx = xd * Math.cos(zdeg) - yd * Math.sin(zdeg) - xd;
        var zy = xd * Math.sin(zdeg) + yd * Math.cos(zdeg) - yd;
        var yx = (xd+zx) * Math.cos(ydeg) - zd * Math.sin(ydeg) - (xd+zx);
        var yz = (xd+zx) * Math.sin(ydeg) + zd * Math.cos(ydeg) - zd;
        var xy = (yd+zy) * Math.cos(xdeg) - (zd+yz) * Math.sin(xdeg) - (yd+zy);
        var xz = (yd+zy) * Math.sin(xdeg) + (zd+yz) * Math.cos(xdeg) - (zd+yz);
        var offset = [yx+zx, zy+xy, xz+yz];
        position = position.add(offset).add([xadd,yadd,zadd]);
        bodies[i].adjustedPosition = position;
        /*----------------------------*/
        /*
        drawBody(bodies[i].position[0], bodies[i].position[1], bodies[i].radius, bodies[i].color, paper);
        if (alpha < 1) {
            drawLine(bodies[i].position[0], bodies[i].position[1], firstPosition[0], firstPosition[1], bodies[i].radius, bodies[i].color, paper);
        }
        */
    }
    //debug(bodies[0].position.toString());
    //debug('thing');
    bodies.sort(function(a,b) {return a.adjustedPosition[2]-b.adjustedPosition[2];});
    for (var i = bodies.length; i--;) {
        var position = bodies[i].adjustedPosition;
        var scale = 600/(600+position[2]);
        if (scale > 0) {
            position = position.multiply(scale);
            var radius = bodies[i].radius * scale;
            var grad = paper.createRadialGradient(position[0], position[1], 0.1*radius*scale, position[0], position[1], radius);
            grad.addColorStop(0, bodies[i].color);
            grad.addColorStop(0.95, 'rgba(0,0,0,1.0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.0)');
            drawBody(position[0], position[1], radius, grad, paper);
        }
    }
    energy = '' + energy;
    var exponent = energy.split('e');
    energy = exponent[0];
    exponent = exponent[1];
    if (!exponent) {exponent = '+0';}
    energy = energy.slice(0, 15);
    document.getElementById('energy').innerHTML = 'E: ' + energy + 'e' + exponent;
    counts++;
    if (bodyCount != bodies.length) {
        bodyCount = bodies.length;
        document.getElementById('bodyCount').innerHTML = 'There are ' + bodyCount + ' bodies.';
    }
    //ydeg += Math.PI / 3600;
    if (!isPaused) {
        setTimeout(calculateOrbit, 16);
    }
}

function addBody(x, y, newMass, randomOrientation) {
    var newRadius = Math.pow((newMass) / 2.50596227828973444312e19, 1/2); // using average density of all planets of 3.1251e3 kg / m
    //newRadius /= 1e5; // 1px = 1e-5 m
    if (newRadius < 6000) {
	newRadius = 6000;
    }
    var newPosition = [x, y, zadd];
    var velocity = [0, 0, 0];
    var bodiesLength = bodies.length;
    if (bodiesLength > 0) {
        // just using the most massive body (body exerting greatest force), instead of COM, for simplicity
        var mostMassiveBody = bodies[bodies.length - 1];
        var massiveIndex = 0;
        var delp = mostMassiveBody.position.subtract(newPosition);
        var massDistance = mostMassiveBody.mass / delp.dot(delp);
        for (var i = bodiesLength - 1; i--;) {
            var delp = bodies[i].position.subtract(newPosition);
            var newMassDistance = bodies[i].mass / delp.dot(delp);
            if (newMassDistance > massDistance) {
                mostMassiveBody = bodies[i];
                massiveIndex = i;
                massDistance = newMassDistance;
            }
        }
        // Get the unit vector from the new body to the most massive body (COM), rotate it 90 degrees (either left or right),
        // multiply the unit vector by the velocity (sqrt(GM / R)) to get the velocity vector, then add the velocity vector
        // from the most massive body to get an orbital velocity vector relative to COM
        velocity = mostMassiveBody.position.subtract(newPosition).toUnitVector().rotate(-Math.PI / 2).multiply(Math.sqrt((gravConstant * mostMassiveBody.mass) / mostMassiveBody.position.distanceFrom(newPosition))).add(mostMassiveBody.velocity);
    } else {
        velocity = [0,0,0];
    }
    if (typeof(randomOrientation) != 'undefined' && randomOrientation == true) {
        velocity = velocity.rotate(2*Math.PI*Math.random());
    }
    debug(velocity);
    if (velocity.length == 2) {
        velocity = [velocity[0], velocity[1], 0];
    }
    var color = 'rgb(' + (127 + randInt(127)) + ',' + (127 + randInt(127)) + ',' + (127 + randInt(127)) + ')';
    bodies[bodies.length] = {mass: newMass, velocity: velocity, radius: newRadius, position: newPosition, color:color, adjustedPosition:[]};
    if (isPaused) {
        drawBody(x, y, newRadius, color, paper);
    }
}

function addRings(dist, center, interval, mass) {
    var deg = Math.PI / 180;
    var max = Math.floor(360/interval);
    for (var i = max; i--;) {
        var newdist = dist.rotate(deg * (interval*i)).add(center);
	addBody(newdist[0], newdist[1], mass);
    }
}

function loadBodies(id) {
    paper.fillStyle = 'rgb(0,0,0)';
    paper.fillRect(0, 0, windowWidth, windowHeight);
    switch (id) {
        case 0:
            // Solar System
            // Most planets/moons have radius 3000 so they can be seen
            // Moons have to be given retrograde orbits for stability
            // Moons that are interesting but unstable: Io, Titania
            bodies = [
                 {velocity: [0, 0, 0], // Sun
                 position: [500000, 300000, 0],
                 radius:6960,
                 mass:1.9889e30,
                 color:'#ff0'},

                 {velocity: [0, 5289.007336, 0], // Mercury
                 position: [1079100, 300000, 0],
                 radius: 3000,
                 mass: 3.3022e23,
                 color:'#ddd'},
                 
                 {velocity: [0, 3869.165024, 0], // Venus
                 position: [1582100, 300000, 0],
                 radius: 3000,
                 mass: 4.8685e24,
                 color:'#aac'},

                 {velocity: [0, 3290.6762, 0], // Earth
                 position: [1996000, 300000, 0],
                 radius: 3000,
                 mass: 5.9736e24,
                 color:'#99f'},

                 {velocity: [0, 3178.17145, 0], // Moon
                 position: [1999844, 300000, 0],
                 radius: 3000,
                 mass: 7.3477e22,
                 color:'#ddd'},

                 {velocity: [0, 2665.880512, 0], // Mars
                 position: [2779400, 300000, 0],
                 radius: 3000,
                 mass: 6.4185e23,
                 color:'#f99'},
                 /*

                 {velocity: [0, 1442.473015], // Jupiter
                 position: [8285500, 300000],
                 radius: 3000,
                 mass: 1.896e27,
                 color:'#99f'},

                 {velocity: [0, -74.69873852], // Europa
                 position: [8292209, 300000],
                 radius: 3000,
                 mass: 4.8e22,
                 color:'#fff'},

                 {velocity: [0, 241.341411], // Ganymede
                 position: [8296204, 300000],
                 radius: 3000,
                 mass: 1.4819e23,
                 color:'#ddd'},

                 {velocity: [0, 536.868698], // Callisto
                 position: [8304430, 300000],
                 radius: 3000,
                 mass: 1.0759e23,
                 color:'#eee'},

/*
                 {velocity: [0, 1189.322762], // Radius of Jupiter's SOI
                 position: [14025961, 3000000],
                 radius: 3000,
                 mass: 1.53576e25,
                 color:'#fff'},

                 {velocity: [0, 1096.884782], // Radius of previous's SOI
                 position: [14040600, 3000000],
                 radius: 3000,
                 mass: 3.894e22,
                 color:'#fff'},
*/
/*
                 {velocity: [0, 1063.083192], // Saturn
                 position: [14834000, 300000],
                 radius: 3000,
                 mass: 5.6846e26,
                 color:'#99f'},

                 {velocity: [0, 155.8494292], // Rhea
                 position: [14839271, 300000],
                 radius: 3000,
                 mass: 2.306e21,
                 color:'#ddd'},

                 {velocity: [0, 447.539578], // Titan
                 position: [14846220, 300000],
                 radius: 3000,
                 mass: 1.3452e23,
                 color:'#88f'},

/*
                 {velocity: [0, 924.848284], // Radius of Saturn's SOI
                 position: [20576300, 3000000],
                 radius: 3000,
                 mass: 4.3221e22
                 color:'#fff'},
*/
/*
                 {velocity: [0, 750.4187296], // Uranus
                 position: [29267000, 300000],
                 radius: 3000,
                 mass: 8.6810e25,
                 color:'#9f9'},

                 {velocity: [0, 347.6683842], // Titania
                 position: [29271359, 300000],
                 radius: 3000,
                 mass: 3.527e21,
                 color:'#ddd'},

                 {velocity: [0, 402.4638492], // Oberon
                 position: [29272840, 300000],
                 radius: 3000,
                 mass: 3.014e21,
                 color:'#ddd'},

/*
                 {velocity: [0, 689.4155384], // Radius of Uranus's SOI
                 position: [34957000, 3000000],
                 radius: 3000,
                 mass: 1.0022e19
                 color:'#fff'},
*/
/*
                 {velocity: [0, 599.7644084], // Neptune
                 position: [45534000, 300000],
                 radius: 3000,
                 mass: 1.0243e26,
                 color:'#bbf'},

                 {velocity: [0, 114.7803426], // Triton
                 position: [45537547, 300000],
                 radius: 3000,
                 mass:2.14e22,
                 color:'#eee'},

                 {velocity: [0, 476.7555188], // Nereid
                 position: [45589137, 300000],
                 radius: 3000,
                 mass: 3.1e19,
                 color:'#ddd'},

/*
                 {velocity: [0, 548.9496828], // Radius of Neptune's SOI
                 position: [51357100, 3000000],
                 radius: 3000,
                 mass: 8.29683e25,
                 color:'#fff'}
*/
             ];
             break;
        case 1:
            // two-body system
            bodies = [{
                velocity: [0, 0, 1009.01932588033218502780],
                position: [500000, 300000, 0],
                radius: 10000,
                mass: 1e29,
                adjustedPosition: [],
                color: '#ff0'},
            {
                velocity: [0, 0, -1009.01932588033218502780],
                position: [900000, 300000, 0],
                radius: 10000,
                mass: 1e29,
                adjustedPosition: [],
                color: '#ff0'}, ];
            break;
        case 2:
            // A four-body system with all bodies orbiting the common center of mass, not stable
            bodies = [{
                velocity: [0, 1922.34193589967716713965],
                position: [300000, 300000],
                radius: 6000,
                mass: 1e29,
                color: '#ff0'},
            {
                velocity: [0, -1922.34193589967716713965],
                position: [900000, 300000],
                radius: 6000,
                mass: 1e29,
                color: '#ff0'},
            {
                velocity: [1922.34193589967716713965, 0],
                position: [600000, 600000],
                radius: 6000,
                mass: 1e29,
                color: '#ff0'},
            {
                velocity: [-1922.34193589967716713965, 0],
                position: [600000, 0],
                radius: 6000,
                mass: 1e29,
                color: '#ff0'}, ];
            break;
        case 3:
            // Gliese 876 System
            // Gliese 876d is unstable, system exhibits large movement from massive planets close to star
            bodies = [
                 {velocity: [0, 0], //Gliese 876
                 position: [6000000, 3000000],
                 radius:6960,
                 mass:6.642926e29,
                 color:'#ff0'},

                 {velocity: [0, 5234.45442451708230028402], //Gliese 876b
                 position: [6197472, 3000000],
                 radius: 3000,
                 mass:1.57368e27,
                 color:'#f0f'},

                 {velocity: [0, 4140.16034], // Gliese 876c
                 position: [6315656, 3000000],
                 radius: 3000,
                 mass:5.0054e27,
                 color:'#0ff'}
             ];
             break;
        case 4:
            // 55 Cancri System
            // 55 Cancri A e is unstable, 55 Cancri B may or may not be gravitationally bound to 55 Cancri A in this simulation
            bodies = [
                 {velocity: [0, 0], // 55 Cancri A
                 position: [6000000, 3000000],
                 radius:6960,
                 mass:1.8895e30,
                 color: '#ff0'},

                 {velocity: [0, 9458.08492], // 55 Cancri Ab
                 position: [6172040, 3000000],
                 radius:3000,
                 mass:1.5623e27,
                 color: '#f0f'},

                 {velocity: [0, 6547.062824], // 55 Cancri Ac
                 position: [6359040, 3000000],
                 radius:3000,
                 mass:3.2042e26,
                 color: '#0ff'},

                 {velocity: [0, 3629.3312848], // 55 Cancri Af
                 position: [7168376, 3000000],
                 radius:3000,
                 mass:2.7302e26,
                 color: '#ff0'},

                 {velocity: [0, 1335.25503], // 55 Cancri Ad
                 position: [14631920, 3000000],
                 radius:3000,
                 mass:7.2712e27,
                 color: '#f0f'},

                 {velocity: [0, 98.2827558], 
                 position: [1599240000, 3000000], // 55 Cancri B
                 radius:3000,
                 mass:2.58557e29,
                 color: '#ff0'}
             ];
             break;
        case 5:
            // 51 Pegasi System
            // Only included because it was the first extrasolar planetary system discovered
            // The planet spirals into the star
            bodies = [
                 {velocity: [0, 0], // 51 Pegasi
                 position: [6000000, 3000000],
                 radius:6960,
                 mass:2.1082e30,
                 color: '#ff0'},

                 {velocity: [0, 14758.078936], // 51 Pegasi a
                 position: [6078839, 3000000],
                 radius:3000,
                 mass:8.9491e26,
                 color: '#f00'}
             ];
             break;
        case 6:
            // 47 Ursae Majoris System
            bodies = [
                 {velocity: [0, 0], // 47 Ursae Majoris
                 position: [6000000, 3000000],
                 radius:6960,
                 mass:2.148e30,
                 color: '#ff0'},

                 {velocity: [0, 2359.8596376], // 47 Ursae Majoris b
                 position: [9141600, 3000000],
                 radius:3000,
                 mass:4.79688e27,
                 color: '#f0f'},

                 {velocity: [0, 1802.37257], // 47 Ursae Majoris c
                 position: [11385600, 3000000],
                 radius:3000,
                 mass:1.02384e27,
                 color: '#0ff'},

                 {velocity: [0, 1004.0765516], // 47 Ursae Majoris d
                 position: [23353600, 3000000],
                 radius:3000,
                 mass:3.10944e27,
                 color: '#f00'}
             ];
             break;
        case 7:
            // Upsilon Andromidae System
            // Upsilon Andromidae b is unstable
            bodies = [
                 {velocity: [0, 0], // Upsilon Andromidae
                 position: [6000000, 3000000],
                 radius:6960,
                 mass:2.5468e30,
                 color: '#ff0'},

                 {velocity: [0, 4082.38952], // Upsilon Andromidae c
                 position: [7244672, 3000000],
                 radius:3000,
                 mass:3.6453e27,
                 color: '#f0f'},

                 {velocity: [0, 2341.07776], // Upsilon Andromidae d
                 position: [9784880, 3000000],
                 radius:3000,
                 mass:7.8412e27,
                 color: '#0ff'}
             ];
             break;
        case 8:
            bodies = [
// A "static" pyramid as defined by the following bodies will eventually acquire angular momentum
// showing how errors in the integrator can build up to allow non-physical behavior
// Eventually the angular momentum will increase to the point that outer bodies will be flung out
// Pyramid constructed by setting a bottom row of bodies aligned on the x-axis,
// rotating a radius vector [0, r] for bodies of radius r by -Math.PI / 6, multiplying 2,
// then adding the new vector to the position vector of a body, stacking bodies as appropriate
                 {velocity: [0, 0, 0],
                 position: [200000, 300000, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0, 0],
                 position: [254000, 300000, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0, 0],
                 position: [308000, 393530.7436087194, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0, 0],
                 position: [254000, 393530.7436087194, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0, 0],
                 position: [227000, 346765.3718043597, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0, 0],
                 position: [281000, 346765.3718043597, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0, 0],
                 position: [281000, 440296.1154130791, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#0ff'},

                 {velocity: [0, 0, 0],
                 position: [335000, 346765.3718043597, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0, 0],
                 position: [308000, 300000, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0, 0],
                 position: [362000, 300000, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0, 0],
                 position: [362000, 300000, -1000000],
                 radius:7000,
                 mass:3e-58,
                 color: '#fcf'},

                 {velocity: [0, 0, 0],
                 position: [362000, 300000, 1000000],
                 radius:7000,
                 mass:3e-58,
                 color: '#fcf'},
            ];
            break;
        case 10:
            bodies = [
                 {velocity: [0, 0],
                 position: [0, 300000], // try at 11
                 radius:80000,
                 mass:1e28,
                 color: '#f0f'},

                 {velocity: [-10000, 0],
                 position: [800000, 300000], // try at 11
                 radius:50000,
                 mass:5e20,
                 color: '#ff0'},

                 {velocity: [-10000, 0],
                 position: [890000, 300000], // try at 11
                 radius:40000,
                 mass:4e20,
                 color: '#ff0'},

                 {velocity: [-10000, 0],
                 position: [960000, 300000], // try at 11
                 radius:30000,
                 mass:3e20,
                 color: '#ff0'},

                 {velocity: [-10000, 0],
                 position: [1010000, 300000], // try at 11
                 radius:20000,
                 mass:2e20,
                 color: '#ff0'},

                 {velocity: [-10000, 0],
                 position: [1040000, 300000], // try at 11
                 radius:10000,
                 mass:1e20,
                 color: '#ff0'},
            ];
            break;
        case 11:
            bodies = [
                 {velocity: [0, 0, 0],
                 position: [100000, 300000, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0, 0],
                 position: [154000, 300000, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},


                 {velocity: [0, 0, 0],
                 position: [208000, 300000, 0],
                 radius:27000,
                 mass:3e28,
                 color: '#f00'},

                 {velocity: [0, 0, 0],
                 position: [1000000, 300000, 0], // try at 11
                 radius:27000,
                 mass:3e28,
                 color: '#ff0'},

                 {velocity: [0, 0, 0],
                 position: [1000000, 300000, -600000], // try at 11
                 radius:7000,
                 mass:3e28,
                 color: '#ff0'},
            ];
            break;
        case 9:
        default:
            bodies = [];
            break;
    }
    for (var i = bodies.length; i--;) {
        drawBody(bodies[i].position[0], bodies[i].position[1], bodies[i].radius, bodies[i].color, paper);
    }
}

window.onload = function() {
    isBounce = true;
    isPaused = false;
    antiFlicker = false;
    bodyCount = 0;
    alpha = 1;
    counts = 0;
    xdeg = 0;
    ydeg = 0;
    zdeg = 0;
    zadd = 500000;
    yadd = 0;
    xadd = 0;
    camx = 0;
    camy = 0;
    camz = 500000;
    var canvas = document.getElementById('canvas');
    windowWidth = getWidth();
    windowHeight = getHeight();
    canvas.width = windowWidth;
    canvas.height = windowHeight;
    var transition = document.getElementById('transition');
    transition.width = windowWidth;
    transition.height = windowHeight;
    paper = canvas.getContext('2d');
    resetCanvas(true);
    document.getElementById('canvas').onclick = addBodyClick;
    document.getElementById('geturl').onclick = getUrl;
    document.getElementById('choosebody').onchange = changeBody;
    document.onkeypress = pageEvents;
    document.onkeydown = handleArrowEvents;
    var canvas = document.getElementById('canvas');
    if (canvas.addEventListener) {
        canvas.addEventListener('DOMMouseScroll', handleScroll, false);
        canvas.addEventListener('mousewheel', handleScroll, false);
    } else if (canvas.attachEvent) {
        canvas.attachEvent('onmousewheel', handleScroll); 
    }
    window.onresize = resizeWindow;
    if (!!window.location.hash) {
        var bodiestring = window.location.hash.substring(1);
        bodies = JSON.parse(bodiestring)
    } else {
        loadBodies(11);
    }
    calculateOrbit();
};
