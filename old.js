//contains alternate code, what was previously commented out in grav-runge-kutta.js

/*
 * Originally in the beginning of resetCanvas
 */
     /*
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
//trying to get a symplectic integrator working
function symplectic(state, derivative, c, d, getEnergy, colliders1, colliders2) {
    getEnergy = !!getEnergy;
    var getColliders = !!colliders1;
    var colliders = {};
    var contact = false;
    var totalEnergy = 0;
    var bodiesLength = state.length;
    for (var i = bodiesLength; i--;) {
        if (c != 0) {
            for (var j = i; j--;) {
                var diff = state[i].position.subtract(state[j].position);
                if (getColliders) {
                    var radii = bodies[i].radius + bodies[j].radius;
                    if (diff.dot(diff) <= (radii*radii)) {
                        if (!colliders[i]) {
                            colliders[i] = [];
                        }
                        if (!colliders[j]) {
                            colliders[j] = [];
                        }
                        if (!(colliders[i].indexOf(j) > 0 || colliders[j].indexOf(i) > 0)) {
                            if (bodies[i].mass > bodies[j].mass) {
                                colliders[i][colliders[i].length] = j;
                            } else {
                                colliders[j][colliders[j].length] = i;
                            }
                            contact = true;
                        }
                    }
                }
                var dist = state[i].position.distanceFrom(state[j].position);
                var mult = gravConstant / (dist * dist* dist);
                var multj = -mult * bodies[j].mass;
                var multi = mult * bodies[i].mass;

                var momentumi = [];
                if (!state[i].momentum) {
                    momentumi = state[i].velocity.multiply(bodies[i].mass);
                } else {
                    momentumi = state[i].momentum;
                }
                var momentumj = [];
                if (!state[j].momentum) {
                    momentumj = state[j].velocity.multiply(bodies[j].mass);
                } else {
                    momentumj = state[j].momentum;
                }
                derivative[i].momentum = derivative[i].momentum.add(momentumi.subtract(diff.multiply(multi * c)));
                derivative[j].momentum = derivative[j].momentum.add(momentumj.subtract(diff.multiply(multj * c)));
                if (counts == 100) {
                    debug("i: " + i);
                    debug("j: " + j);
                    debug(derivative[i].momentum);
                    debug(derivative[j].momentum);
                    debug(diff);
                }

                if (getEnergy) {
                    totalEnergy -= (gravConstant * bodies[j].mass * bodies[i].mass) / state[i].position.distanceFrom(state[j].position);
                }
            }
        } else {
            var momentum = [];
            if (!state[i].momentum) {
                momentum = state[i].velocity.multiply(bodies[i].mass);
            } else {
                momentum = state[i].momentum;
            }
            derivative[i].momentum = momentum;
        }
    }

    for (var i = bodiesLength; i--;) {
        derivative[i].position = state[i].position.add(derivative[i].momentum.multiply(d));
    }
    /*
    for (var i = bodiesLength; i--;) {
        var momentum = [];
        if (!state[i].momentum) {
            momentum = state[i].velocity.multiply(bodies[i].mass);
        } else {
            momentum = state[i].momentum;
        }
        derivative[i].position = state[i].position.add(momentum.multiply(c/bodies[i].mass));
    }
    for (var i = bodiesLength; i--;) {
        for (var j = i; j--;) {
            var diff = derivative[i].position.subtract(derivative[j].position);
            if (getColliders) {
                diff = state[i].position.subtract(state[j].position);
                var radii = bodies[i].radius + bodies[j].radius;
                if (diff.dot(diff) <= (radii*radii)) {
                    if (!colliders[i]) {
                        colliders[i] = [];
                    }
                    if (!colliders[j]) {
                        colliders[j] = [];
                    }
                    if (!(colliders[i].indexOf(j) > 0 || colliders[j].indexOf(i) > 0)) {
                        if (bodies[i].mass > bodies[j].mass) {
                            colliders[i][colliders[i].length] = j;
                        } else {
                            colliders[j][colliders[j].length] = i;
                        }
                        contact = true;
                    }
                }
            }

            var dist = derivative[i].position.distanceFrom(derivative[j].position);
            var mult = gravConstant / (dist * dist * dist);
            var multj = -mult * bodies[j].mass;
            var multi = mult * bodies[i].mass;
            var momentumi = [];
            if (!state[i].momentum) {
                momentumi = state[i].velocity.multiply(bodies[i].mass);
            } else {
                momentumi = state[i].momentum;
            }
            var momentumj = [];
            if (!state[j].momentum) {
                momentumj = state[j].velocity.multiply(bodies[j].mass);
            } else {
                momentumj = state[j].momentum;
            }
            derivative[i].momentum = derivative[i].momentum.add(momentumi.subtract(diff.multiply(multi * d)));
            derivative[j].momentum = derivative[j].momentum.add(momentumj.subtract(diff.multiply(multj * d)));
            if (getEnergy) {
                totalEnergy -= (gravConstant * bodies[j].mass * bodies[i].mass) / state[i].position.distanceFrom(state[j].position);
            }
        }
    }
    */

    if (contact) {
	for (var first in colliders) {
            colliders1[colliders1.length] = +first;
            colliders2[colliders2.length] = colliders[first];
	}
    }
    return totalEnergy;
}
/*
 * Previously in calculateOrbit, before the part that erases the screen (alpha >= 0.001)
 */
     // Symplectic Integration
    // This symplectic integrator based on method outlined in "Symplectic Integrators and their Application to Dynamical Astronomy"
    // by Hiroshi Kinoshita, Haruo Yoshida, and Hiroshi Nakai (1990)
    /*
    var derivative1 = [];
    var derivative2 = [];
    var derivative3 = [];
    var derivative4 = [];
    for (var i = bodiesLength; i--;) {
        derivative1[i] = {position:[0,0], momentum:[0,0]};
        derivative2[i] = {position:[0,0], momentum:[0,0]};
        derivative3[i] = {position:[0,0], momentum:[0,0]};
        derivative4[i] = {position:[0,0], momentum:[0,0]};
    }
    var massiveColliders = [];
    var smallColliders = [];
    var energy;
    var beta = Math.pow(2, 1/3);
    var symInput = (beta + (1/beta) - 1) / 6;
    if (isBounce) {
        //energy = symplectic(bodies, derivative1, 1/(2*(2-beta)), 1/(2-beta), true, massiveColliders, smallColliders);
        //energy = symplectic(bodies, derivative1, symInput + .5, (2*symInput) + 1, true, massiveColliders, smallColliders);
        energy = symplectic(bodies, derivative1, 0, symInput + .5, true, massiveColliders, smallColliders);
    } else {
        //energy = symplectic(bodies, derivative1, 1/(2*(2-beta)), 1/(2-beta), true);
        //energy = symplectic(bodies, derivative1, symInput + .5, (2*symInput) + 1, true);
        energy = symplectic(bodies, derivative1, 0, symInput + .5, true);
    }
    /*
    symplectic(derivative1, derivative2, (1-beta)/(2*(2-beta)), -beta/(2-beta));
    symplectic(derivative2, derivative3, (1-beta)/(2*(2-beta)), 1/(2-beta));
    */
    /*
    symplectic(derivative1, derivative2, (2*symInput) + 1, -symInput);
    symplectic(derivative2, derivative3, (-4*symInput) - 1, -symInput);
    symplectic(derivative3, derivative4, (2*symInput) + 1, symInput + .5);
    */

/*
 * In the conditional for checking if colliding
 */
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
/*
 * In loop that updates bodies position and velocities, forgot why it's there
 */
        /*
        bodies[i].position = derivative3[i].position.add(derivative3[i].momentum.multiply(1/(2*bodies[i].mass*(2-beta))));
        bodies[i].velocity = derivative3[i].momentum.multiply(1/bodies[i].mass);
        */
        /*
        bodies[i].position = derivative1[i].position;
        bodies[i].velocity = derivative1[i].momentum.multiply(1/bodies[i].mass);
        */
        /*
        bodies[i].position = derivative4[i].position;
        bodies[i].velocity = derivative4[i].momentum.multiply(1/bodies[i].mass);
        */

