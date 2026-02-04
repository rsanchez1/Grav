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
    paper.lineWidth = 0.2 * radius;
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
    var zeroVelocity = false;
    if (!!ev.ctrlKey) {
        zeroVelocity = true;
    }
    var posx = (x * (rectDimensions[2] / windowWidth)) - rectDimensions[0];
    var posy = (y * (rectDimensions[3] / windowHeight)) - rectDimensions[1];
    var globalx = globalOrigin[0] + rectDimensions[0];
    var globaly = globalOrigin[1] + rectDimensions[1];
    var thisAngle = isRotating ? angle : 0;
    var relx = posx - globalOrigin[0];
    var rely = posy - globalOrigin[1];
    var cosangle = Math.cos(-thisAngle);
    var sinangle = Math.sin(-thisAngle);
    posx = (cosangle * relx) + (-sinangle * rely) + globalOrigin[0];
    posy = (sinangle * relx) + (cosangle * rely) + globalOrigin[1];
    addBody(posx, posy, +document.getElementById('newmass').value, randomOrientation, zeroVelocity);
}

function handleArrowEvents(ev) {
    var ek = ev.which;
}

function pageEvents(ev) {
    var ek = ev.which;
    debug(ek);
    var willReset = false;
    var oldRect = rectDimensions.slice();
    // transform the canvas based on movement/zoom
    rectDimensions[0] += rectDimensions[2] * ((-(ek == 105) * (45 / 990)) || (+(ek == 111) * (45 / 900)) || ((-(ek == 100) || (+(ek == 97))) * (1 / 30)));
    rectDimensions[1] += rectDimensions[3] * (((-(ek == 105) || +(ek == 111)) * (45 / 990)) || ((-(ek == 115) || (+(ek == 119))) * (1 / 30)));
    rectDimensions[2] *= (+(ek == 111) * 1.10) || (+(ek == 105) * (90 / 99)) || 1;
    rectDimensions[3] *= (+(ek == 111) * 1.10) || (+(ek == 105) * (90 / 99)) || 1;
    willReset = ek == 111 || ek == 105 || ek == 115 || ek == 100 || ek == 119 || ek == 97 || ek == 107 || ek == 117 || ek == 106 || ek == 105;

    var scale = rectDimensions[2] / windowWidth;
    // increase/decrease trace length
    alpha *= (0.5 * +(ek == 109)) || (2 * +(ek == 108)) || 1;
    if (alpha > 1) {
        alpha = 1;
    }
    if (alpha < 0.001) {
        alpha = 0.001;
    }
    // toggle trace
    if (ek == 116) {
        if (alpha < 1) {
            alpha = 1;
        } else {
            alpha = 0.05;
        }
    }
    // pause
    if (ek == 112) {
        isPaused = !isPaused;
        if (!isPaused) {
            scheduleNextFrame();
        }
    }
    // hide instructions
    if (ek == 113) {
        document.getElementById('instructions').style.display = (document.getElementById('instructions').style.display == 'none' ? 'block' : 'none');
    }
    // toggle bounce
    if (ek == 98) {
        isBounce = !isBounce;
        document.getElementById('bounce').innerHTML = (isBounce && 'On') || 'Off';
    }
    // toggle rotating reference frame
    if (ek == 114) {
        isRotating = !isRotating;
        document.getElementById('rotating').innerHTML = (isRotating && 'On') || 'Off';
    }
    resetCanvas(oldRect, willReset);
}

function resizeWindow() {
    var scaleWidth = rectDimensions[2] / windowWidth;
    var scaleHeight = rectDimensions[3] / windowHeight;
    windowWidth = getWidth();
    windowHeight = getHeight();
    var oldRect = rectDimensions.slice();
    paper.canvas.width = windowWidth;
    paper.canvas.height = windowHeight;
    var transition = document.getElementById('transition');
    transition.width = windowWidth;
    transition.height = windowHeight;
    rectDimensions[2] = scaleWidth * windowWidth;
    rectDimensions[3] = scaleHeight * windowHeight;
    resetCanvas(oldRect, true);
}

function resetCanvas(oldRect, willReset) {
    document.getElementById('viewx').innerHTML = 'X: ' + parseInt(rectDimensions[0], 10);
    document.getElementById('viewy').innerHTML = 'Y: ' + parseInt(rectDimensions[1], 10);
    document.getElementById('viewidth').innerHTML = 'Width: ' + parseInt(rectDimensions[2], 10);
    document.getElementById('viewheight').innerHTML = 'Height: ' + parseInt(rectDimensions[3], 10);
}

function changeBody(ev) {
    loadBodies(+ev.target.value);
    this.blur();
}

function getUrl() {
    var out = [];
    for (var i = 0; i < bodyCount; i++) {
        out[out.length] = {
            mass: mass[i],
            radius: radius[i],
            color: color[i],
            position: [posX[i], posY[i]],
            velocity: [velX[i], velY[i]]
        };
    }
    window.location.hash = JSON.stringify(out);
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

function cancelEvent(e) {
    e = e ? e : window.event;
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    if (e.preventDefault) {
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
                               // 60s should be in actual time, but in calculations T is number of iterations
                               // ie. if T were calculated for Earth using existing parameters, T is about 2856
                               // because there are 2856 iterations in 60 seconds, this would equal about
                               // 21ms/iteration, which is about 33% higher than the theoretical iteration limit of 
                               // 14ms/iteration in the browser
var dt = 1.0;
var softening = 1e3;
var softening2 = softening * softening;
var integrator = 'symplectic'; // 'symplectic' or 'rk4'
var fps = 0;
var frameMs = 0;
var simMs = 0;
var gravMs = 0;
var renderMs = 0;
var lastFrameTime = null;
var fpsSmoothing = 0.9;

var posX = null;
var posY = null;
var velX = null;
var velY = null;
var prevPosX = null;
var prevPosY = null;
var mass = null;
var massG = null;
var invMass = null;
var radius = null;
var color = null;
var capacity = 0;
var bodyCount = 0;
var bodyCountDisplay = 0;

var k1px = null;
var k1py = null;
var k1vx = null;
var k1vy = null;
var k2px = null;
var k2py = null;
var k2vx = null;
var k2vy = null;
var k3px = null;
var k3py = null;
var k3vx = null;
var k3vy = null;
var k4px = null;
var k4py = null;
var k4vx = null;
var k4vy = null;
var tmpPosX = null;
var tmpPosY = null;
var tmpVelX = null;
var tmpVelY = null;

var initialEnergy = null;
var lastEnergy = 0;
var isBounce = false;
var isPaused = false;
var isRotating = false;
var alpha = 1;
var counts = 0;
var angle = 0;
var angularVelocity = 0;
var globalOrigin = [0, 0];
var globalFunc = function() {};
var paper = null;
var rectDimensions = null;
var windowWidth = 0;
var windowHeight = 0;
var framePending = false;

function resizeFloat64(arr, newCap) {
    var next = new Float64Array(newCap);
    if (arr) {
        next.set(arr);
    }
    return next;
}

function ensureCapacity(n) {
    if (n <= capacity) {
        return;
    }
    var newCap = Math.max(16, capacity * 2, n);
    posX = resizeFloat64(posX, newCap);
    posY = resizeFloat64(posY, newCap);
    velX = resizeFloat64(velX, newCap);
    velY = resizeFloat64(velY, newCap);
    prevPosX = resizeFloat64(prevPosX, newCap);
    prevPosY = resizeFloat64(prevPosY, newCap);
    mass = resizeFloat64(mass, newCap);
    massG = resizeFloat64(massG, newCap);
    invMass = resizeFloat64(invMass, newCap);
    radius = resizeFloat64(radius, newCap);
    color = color ? color.slice() : new Array(newCap);
    color.length = newCap;

    k1px = resizeFloat64(k1px, newCap);
    k1py = resizeFloat64(k1py, newCap);
    k1vx = resizeFloat64(k1vx, newCap);
    k1vy = resizeFloat64(k1vy, newCap);
    k2px = resizeFloat64(k2px, newCap);
    k2py = resizeFloat64(k2py, newCap);
    k2vx = resizeFloat64(k2vx, newCap);
    k2vy = resizeFloat64(k2vy, newCap);
    k3px = resizeFloat64(k3px, newCap);
    k3py = resizeFloat64(k3py, newCap);
    k3vx = resizeFloat64(k3vx, newCap);
    k3vy = resizeFloat64(k3vy, newCap);
    k4px = resizeFloat64(k4px, newCap);
    k4py = resizeFloat64(k4py, newCap);
    k4vx = resizeFloat64(k4vx, newCap);
    k4vy = resizeFloat64(k4vy, newCap);
    tmpPosX = resizeFloat64(tmpPosX, newCap);
    tmpPosY = resizeFloat64(tmpPosY, newCap);
    tmpVelX = resizeFloat64(tmpVelX, newCap);
    tmpVelY = resizeFloat64(tmpVelY, newCap);

    capacity = newCap;
}

function clearBodies() {
    bodyCount = 0;
}

function pushBody(px, py, vx, vy, m, r, c) {
    var nextIndex = bodyCount;
    ensureCapacity(nextIndex + 1);
    posX[nextIndex] = px;
    posY[nextIndex] = py;
    velX[nextIndex] = vx;
    velY[nextIndex] = vy;
    prevPosX[nextIndex] = px;
    prevPosY[nextIndex] = py;
    mass[nextIndex] = m;
    massG[nextIndex] = gravConstant * m;
    invMass[nextIndex] = 1 / m;
    radius[nextIndex] = r;
    color[nextIndex] = c;
    bodyCount++;
}

function computeDerivatives(statePosX, statePosY, stateVelX, stateVelY, outDPX, outDPY, outDVX, outDVY) {
    var i;
    for (i = 0; i < bodyCount; i++) {
        outDPX[i] = stateVelX[i];
        outDPY[i] = stateVelY[i];
        outDVX[i] = 0;
        outDVY[i] = 0;
    }
    for (i = 0; i < bodyCount; i++) {
        var pix = statePosX[i];
        var piy = statePosY[i];
        for (var j = i + 1; j < bodyCount; j++) {
            var dx = pix - statePosX[j];
            var dy = piy - statePosY[j];
            var dist2 = (dx * dx) + (dy * dy) + softening2;
            var dist = Math.sqrt(dist2);
            var invDist3 = 1 / (dist2 * dist);
            var factor = gravConstant * invDist3;
            var ax = -factor * mass[j] * dx;
            var ay = -factor * mass[j] * dy;
            var bx = factor * mass[i] * dx;
            var by = factor * mass[i] * dy;
            outDVX[i] += ax;
            outDVY[i] += ay;
            outDVX[j] += bx;
            outDVY[j] += by;
        }
    }
}

function computeAccelerations(statePosX, statePosY, outAx, outAy) {
    for (var i = 0; i < bodyCount; i++) {
        outAx[i] = 0;
        outAy[i] = 0;
    }
    for (var i = 0; i < bodyCount; i++) {
        var pix = statePosX[i];
        var piy = statePosY[i];
        for (var j = i + 1; j < bodyCount; j++) {
            var dx = pix - statePosX[j];
            var dy = piy - statePosY[j];
            var dist2 = (dx * dx) + (dy * dy) + softening2;
            var dist = Math.sqrt(dist2);
            var invDist3 = 1 / (dist2 * dist);
            var factor = gravConstant * invDist3;
            var ax = -factor * mass[j] * dx;
            var ay = -factor * mass[j] * dy;
            var bx = factor * mass[i] * dx;
            var by = factor * mass[i] * dy;
            outAx[i] += ax;
            outAy[i] += ay;
            outAx[j] += bx;
            outAy[j] += by;
        }
    }
}

function computePotentialEnergy() {
    var total = 0;
    for (var i = 0; i < bodyCount; i++) {
        var pix = posX[i];
        var piy = posY[i];
        for (var j = i + 1; j < bodyCount; j++) {
            var dx = pix - posX[j];
            var dy = piy - posY[j];
            var dist = Math.sqrt((dx * dx) + (dy * dy) + softening2);
            total -= gravConstant * mass[i] * mass[j] / dist;
        }
    }
    return total;
}

function resolveCollisions() {
    if (!isBounce) {
        return;
    }
    for (var i = 0; i < bodyCount; i++) {
        var pix = posX[i];
        var piy = posY[i];
        for (var j = i + 1; j < bodyCount; j++) {
            var dx = pix - posX[j];
            var dy = piy - posY[j];
            var radii = radius[i] + radius[j];
            var dist2 = (dx * dx) + (dy * dy);
            if (dist2 <= (radii * radii)) {
                var dist = Math.sqrt(dist2) || 1e-9;
                var nx = dx / dist;
                var ny = dy / dist;
                // minimum translation distance to push bodies apart after intersecting
                var overlap = radii - dist;
                var im1 = invMass[i];
                var im2 = invMass[j];
                var totalInv = im1 + im2;
                var move1 = overlap * (im1 / totalInv);
                var move2 = overlap * (im2 / totalInv);
                posX[i] += nx * move1;
                posY[i] += ny * move1;
                posX[j] -= nx * move2;
                posY[j] -= ny * move2;
                // impact speed
                var vn = (velX[i] * nx + velY[i] * ny) - (velX[j] * nx + velY[j] * ny);
                if (vn <= 0) {
                    var impulse = (-2 * vn) / totalInv;
                    velX[i] += impulse * nx * im1;
                    velY[i] += impulse * ny * im1;
                    velX[j] -= impulse * nx * im2;
                    velY[j] -= impulse * ny * im2;
                }
            }
        }
    }
}

function calculateOrbit(timestamp) {
    if (typeof(timestamp) === 'number') {
        if (lastFrameTime !== null) {
            frameMs = timestamp - lastFrameTime;
            var instantFps = frameMs > 0 ? (1000 / frameMs) : 0;
            fps = (fpsSmoothing * fps) + ((1 - fpsSmoothing) * instantFps);
        }
        lastFrameTime = timestamp;
    }

    var nowFunc = (window.performance && performance.now) ? function() { return performance.now(); } : null;
    var simStart = nowFunc ? nowFunc() : 0;
    var gravStart = 0;
    var gravEnd = 0;
    var renderStart = 0;
    var renderEnd = 0;
    if (alpha >= 0.001) {
        paper.fillStyle = 'rgba(0,0,0,' + alpha + ')';
        paper.fillRect(0, 0, windowWidth, windowHeight);
    }

    for (var i = 0; i < bodyCount; i++) {
        prevPosX[i] = posX[i];
        prevPosY[i] = posY[i];
    }

    if (integrator === 'symplectic') {
        if (nowFunc) {
            gravStart = nowFunc();
        }
        // Velocity Verlet (symplectic)
        computeAccelerations(posX, posY, k1vx, k1vy);
        var halfDt2 = 0.5 * dt * dt;
        for (var i = 0; i < bodyCount; i++) {
            posX[i] += (velX[i] * dt) + (k1vx[i] * halfDt2);
            posY[i] += (velY[i] * dt) + (k1vy[i] * halfDt2);
        }
        computeAccelerations(posX, posY, k2vx, k2vy);
        var halfDt = 0.5 * dt;
        for (var i = 0; i < bodyCount; i++) {
            velX[i] += (k1vx[i] + k2vx[i]) * halfDt;
            velY[i] += (k1vy[i] + k2vy[i]) * halfDt;
        }
        if (nowFunc) {
            gravEnd = nowFunc();
        }
    } else {
        if (nowFunc) {
            gravStart = nowFunc();
        }
        // RK4 derivatives and intermediate
        var hh = 0.5 * dt; // rk4 half timestep
        var h6 = (1 / 6) * dt; // rk4 1/6 timestep

        computeDerivatives(posX, posY, velX, velY, k1px, k1py, k1vx, k1vy);
        for (var i = 0; i < bodyCount; i++) {
            tmpPosX[i] = posX[i] + (k1px[i] * hh);
            tmpPosY[i] = posY[i] + (k1py[i] * hh);
            tmpVelX[i] = velX[i] + (k1vx[i] * hh);
            tmpVelY[i] = velY[i] + (k1vy[i] * hh);
        }
        computeDerivatives(tmpPosX, tmpPosY, tmpVelX, tmpVelY, k2px, k2py, k2vx, k2vy);
        for (var i = 0; i < bodyCount; i++) {
            tmpPosX[i] = posX[i] + (k2px[i] * hh);
            tmpPosY[i] = posY[i] + (k2py[i] * hh);
            tmpVelX[i] = velX[i] + (k2vx[i] * hh);
            tmpVelY[i] = velY[i] + (k2vy[i] * hh);
        }
        computeDerivatives(tmpPosX, tmpPosY, tmpVelX, tmpVelY, k3px, k3py, k3vx, k3vy);
        for (var i = 0; i < bodyCount; i++) {
            tmpPosX[i] = posX[i] + (k3px[i] * dt);
            tmpPosY[i] = posY[i] + (k3py[i] * dt);
            tmpVelX[i] = velX[i] + (k3vx[i] * dt);
            tmpVelY[i] = velY[i] + (k3vy[i] * dt);
        }
        computeDerivatives(tmpPosX, tmpPosY, tmpVelX, tmpVelY, k4px, k4py, k4vx, k4vy);

        for (var i = 0; i < bodyCount; i++) {
            posX[i] += (k1px[i] + (2 * k2px[i]) + (2 * k3px[i]) + k4px[i]) * h6;
            posY[i] += (k1py[i] + (2 * k2py[i]) + (2 * k3py[i]) + k4py[i]) * h6;
            velX[i] += (k1vx[i] + (2 * k2vx[i]) + (2 * k3vx[i]) + k4vx[i]) * h6;
            velY[i] += (k1vy[i] + (2 * k2vy[i]) + (2 * k3vy[i]) + k4vy[i]) * h6;
        }
        if (nowFunc) {
            gravEnd = nowFunc();
        }
    }

    resolveCollisions();

    if (nowFunc) {
        renderStart = nowFunc();
    }
    var scale = rectDimensions[2] / windowWidth;
    var comx = 0;
    var comy = 0;
    var totalMass = 0;
    globalFunc();
    angle += angularVelocity;
    angle %= 2 * Math.PI;
    var globalx = globalOrigin[0] + rectDimensions[0];
    var globaly = globalOrigin[1] + rectDimensions[1];
    var cosAngle = 1;
    var sinAngle = 0;
    if (isRotating) {
        cosAngle = Math.cos(angle);
        sinAngle = Math.sin(angle);
    }
    for (var i = 0; i < bodyCount; i++) {
        var radiusScaled = radius[i] / scale;
        if (radiusScaled < 2) {
            radiusScaled = 2;
        }
        var drawx = posX[i] + rectDimensions[0];
        var drawy = posY[i] + rectDimensions[1];
        if (isRotating) {
            var relx = drawx - globalx;
            var rely = drawy - globaly;
            drawx = (cosAngle * relx) + (-sinAngle * rely) + globalx;
            drawy = (sinAngle * relx) + (cosAngle * rely) + globaly;
        }
        drawx = drawx / scale;
        drawy = drawy / scale;
        comx += drawx * mass[i];
        comy += drawy * mass[i];
        totalMass += mass[i];
        drawBody(drawx, drawy, radiusScaled, color[i], paper);
        if (alpha < 1) {
            var prevx = prevPosX[i] + rectDimensions[0];
            var prevy = prevPosY[i] + rectDimensions[1];
            if (isRotating) {
                var prel = prevx - globalx;
                var prely = prevy - globaly;
                prevx = (cosAngle * prel) + (-sinAngle * prely) + globalx;
                prevy = (sinAngle * prel) + (cosAngle * prely) + globaly;
            }
            prevx = prevx / scale;
            prevy = prevy / scale;
            drawLine(drawx, drawy, prevx, prevy, radiusScaled, color[i], paper);
        }
    }
    comx = comx / totalMass;
    comy = comy / totalMass;
    drawBody(comx, comy, 3, '#fff', paper);
    paper.strokeStyle = '#f77';
    paper.stroke();

    var potential = computePotentialEnergy();
    var kinetic = 0;
    for (var i = 0; i < bodyCount; i++) {
        kinetic += 0.5 * mass[i] * ((velX[i] * velX[i]) + (velY[i] * velY[i]));
    }
    var energy = potential + kinetic;
    lastEnergy = energy;
    if (initialEnergy === null) {
        initialEnergy = energy;
    }
    var delta = energy - initialEnergy;

    var eStr = '' + energy;
    var eParts = eStr.split('e');
    var eMant = eParts[0];
    var eExp = eParts[1] || '+0';
    eMant = eMant.slice(0, 15);
    document.getElementById('energy').innerHTML = 'E: ' + eMant + 'e' + eExp;

    var kStr = '' + kinetic;
    var kParts = kStr.split('e');
    var kMant = kParts[0];
    var kExp = kParts[1] || '+0';
    kMant = kMant.slice(0, 15);
    document.getElementById('energyK').innerHTML = 'K: ' + kMant + 'e' + kExp;

    var uStr = '' + potential;
    var uParts = uStr.split('e');
    var uMant = uParts[0];
    var uExp = uParts[1] || '+0';
    uMant = uMant.slice(0, 15);
    document.getElementById('energyU').innerHTML = 'U: ' + uMant + 'e' + uExp;

    var dStr = '' + delta;
    var dParts = dStr.split('e');
    var dMant = dParts[0];
    var dExp = dParts[1] || '+0';
    dMant = dMant.slice(0, 15);
    document.getElementById('energyDelta').innerHTML = 'dE: ' + dMant + 'e' + dExp;

    if (nowFunc) {
        renderEnd = nowFunc();
        gravMs = gravEnd - gravStart;
        renderMs = renderEnd - renderStart;
        simMs = renderEnd - simStart;
        document.getElementById('fps').innerHTML = 'FPS: ' + (fps ? fps.toFixed(1) : '--');
        document.getElementById('frameMs').innerHTML = 'Frame: ' + (frameMs ? frameMs.toFixed(2) : '--') + ' ms';
        document.getElementById('simMs').innerHTML = 'Sim: ' + simMs.toFixed(2) + ' ms';
        document.getElementById('gravMs').innerHTML = 'Gravity: ' + gravMs.toFixed(2) + ' ms';
        document.getElementById('renderMs').innerHTML = 'Render: ' + renderMs.toFixed(2) + ' ms';
        document.getElementById('integratorLabel').innerHTML = 'Integrator: ' + integrator;
        document.getElementById('dtLabel').innerHTML = 'dt: ' + dt;
        document.getElementById('softeningLabel').innerHTML = 'softening: ' + softening;
    }

    counts++;
    if (bodyCountDisplay != bodyCount) {
        bodyCountDisplay = bodyCount;
        document.getElementById('bodyCount').innerHTML = 'There are ' + bodyCount + ' bodies.';
    }
    if (!isPaused) {
        scheduleNextFrame();
    }
}

function scheduleNextFrame() {
    if (framePending) {
        return;
    }
    framePending = true;
    window.requestAnimationFrame(function(ts) {
        framePending = false;
        calculateOrbit(ts);
    });
}

function addBody(x, y, newMass, randomOrientation, zeroVelocity) {
    var newRadius = Math.pow((newMass) / 2.50596227828973444312e19, 0.5); // using average density of all planets of 3.1251e3 kg / m
    var newPositionX = x;
    var newPositionY = y;
    var velocityX = 0;
    var velocityY = 0;
    if (bodyCount > 0) {
        // just using the most massive body (body exerting greatest force), instead of COM, for simplicity
        var mostIndex = 0;
        var dx0 = posX[0] - newPositionX;
        var dy0 = posY[0] - newPositionY;
        var best = mass[0] / ((dx0 * dx0) + (dy0 * dy0) + softening2);
        for (var i = 1; i < bodyCount; i++) {
            var dx = posX[i] - newPositionX;
            var dy = posY[i] - newPositionY;
            var score = mass[i] / ((dx * dx) + (dy * dy) + softening2);
            if (score > best) {
                best = score;
                mostIndex = i;
            }
        }
        var rdx = posX[mostIndex] - newPositionX;
        var rdy = posY[mostIndex] - newPositionY;
        var rDist = Math.sqrt((rdx * rdx) + (rdy * rdy) + softening2);
        var ux = rdx / rDist;
        var uy = rdy / rDist;
        // rotate 90 degrees for orbital velocity
        var ox = -uy;
        var oy = ux;
        var speed = Math.sqrt((gravConstant * mass[mostIndex]) / rDist);
        velocityX = ox * speed + velX[mostIndex];
        velocityY = oy * speed + velY[mostIndex];
        randomOrientation = false;
    }
    if (typeof(randomOrientation) != 'undefined' && randomOrientation == true) {
        var angle = 2 * Math.PI * Math.random();
        var cosangle = Math.cos(angle);
        var sinangle = Math.sin(angle);
        var rvx = (cosangle * velocityX) + (-sinangle * velocityY);
        var rvy = (sinangle * velocityX) + (cosangle * velocityY);
        velocityX = rvx;
        velocityY = rvy;
    }
    if (typeof(zeroVelocity) != 'undefined' && zeroVelocity == true) {
        velocityX = 0;
        velocityY = 0;
    }
    var c = 'rgb(' + (127 + randInt(127)) + ',' + (127 + randInt(127)) + ',' + (127 + randInt(127)) + ')';
    pushBody(newPositionX, newPositionY, velocityX, velocityY, newMass, newRadius, c);
    if (isPaused) {
        drawBody(newPositionX, newPositionY, newRadius, c, paper);
    }
}

function addRings(dist, center, interval, m) {
    var deg = Math.PI / 180;
    var max = Math.floor(360 / interval);
    for (var i = max; i--;) {
        var angle = deg * (interval * i);
        var cosangle = Math.cos(angle);
        var sinangle = Math.sin(angle);
        var rx = (cosangle * dist[0]) + (-sinangle * dist[1]);
        var ry = (sinangle * dist[0]) + (cosangle * dist[1]);
        addBody(rx + center[0], ry + center[1], m);
    }
}

function loadBodies(id) {
    paper.fillStyle = 'rgb(0,0,0)';
    paper.fillRect(-rectDimensions[0], -rectDimensions[1], rectDimensions[2], rectDimensions[3]);
    angle = 0;
    angularVelocity = 0;
    globalOrigin = [0, 0];
    globalFunc = function() {};
    counts = 0;
    initialEnergy = null;
    bodyCountDisplay = -1;
    clearBodies();

    function preset(list) {
        for (var i = 0; i < list.length; i++) {
            var b = list[i];
            pushBody(b.position[0], b.position[1], b.velocity[0], b.velocity[1], b.mass, b.radius, b.color);
        }
    }

    switch (id) {
        case 0:
            // Solar System
            preset([
                {velocity: [0, 0], position: [500000, 300000], radius: 6960, mass: 1.9889e30, color:'#ff0'},
                {velocity: [0, 5289.007336], position: [1079100, 300000], radius: 3000, mass: 3.3022e23, color:'#ddd'},
                {velocity: [0, 3869.165024], position: [1582100, 300000], radius: 3000, mass: 4.8685e24, color:'#aac'},
                {velocity: [0, 3290.6762], position: [1996000, 300000], radius: 3000, mass: 5.9736e24, color:'#99f'},
                {velocity: [0, 3178.17145], position: [1999844, 300000], radius: 3000, mass: 7.3477e22, color:'#ddd'},
                {velocity: [0, 2665.880512], position: [2779400, 300000], radius: 3000, mass: 6.4185e23, color:'#f99'},
                {velocity: [0, 1442.473015], position: [8285500, 300000], radius: 3000, mass: 1.896e27, color:'#99f'},
                {velocity: [0, -74.69873852], position: [8292209, 300000], radius: 3000, mass: 4.8e22, color:'#fff'},
                {velocity: [0, 241.341411], position: [8296204, 300000], radius: 3000, mass: 1.4819e23, color:'#ddd'},
                {velocity: [0, 536.868698], position: [8304430, 300000], radius: 3000, mass: 1.0759e23, color:'#eee'},
                {velocity: [0, 1063.083192], position: [14834000, 300000], radius: 3000, mass: 5.6846e26, color:'#99f'},
                {velocity: [0, 155.8494292], position: [14839271, 300000], radius: 3000, mass: 2.306e21, color:'#ddd'},
                {velocity: [0, 447.539578], position: [14846220, 300000], radius: 3000, mass: 1.3452e23, color:'#88f'},
                {velocity: [0, 750.4187296], position: [29267000, 300000], radius: 3000, mass: 8.6810e25, color:'#9f9'},
                {velocity: [0, 347.6683842], position: [29271359, 300000], radius: 3000, mass: 3.527e21, color:'#ddd'},
                {velocity: [0, 402.4638492], position: [29272840, 300000], radius: 3000, mass: 3.014e21, color:'#ddd'},
                {velocity: [0, 599.7644084], position: [45534000, 300000], radius: 3000, mass: 1.0243e26, color:'#bbf'},
                {velocity: [0, 114.7803426], position: [45537547, 300000], radius: 3000, mass: 2.14e22, color:'#eee'},
                {velocity: [0, 476.7555188], position: [45589137, 300000], radius: 3000, mass: 3.1e19, color:'#ddd'}
            ]);
            break;
        case 1:
            // two-body system
            angle = 0;
            angularVelocity = 2 * Math.PI / 1245.40435371695954330138;
            globalOrigin = [700000, 300000];
            preset([
                {velocity: [0, 1009.01932588033218502780], position: [500000, 300000], radius: 10000, mass: 1e29, color: '#ff0'},
                {velocity: [0, -1009.01932588033218502780], position: [900000, 300000], radius: 10000, mass: 1e29, color: '#ff0'}
            ]);
            break;
        case 21:
            angle = 0;
            angularVelocity = 2 * Math.PI / 139.56194206293700933434;
            globalOrigin = [500000, 300000];
            preset([
                {velocity: [0, 8.5753931246], position: [499809.3418472522, 300000], radius: 10000, mass: 1.9889e30, color: '#ff0'},
                {velocity: [0, -8995.5692961461], position: [699809.341847252, 300000], radius: 5000, mass: 1.896e27, color: '#ff0'},
                {velocity: [0, 8879.6940], position: [294700.658152748, 300000], radius: 1, mass: 1e-30, color: '#ff0'}
            ]);
            break;
        case 2:
            angle = 0;
            angularVelocity = 2 * Math.PI / 1169.38970105645338634783;
            globalOrigin = [600000, 300000];
            preset([
                {velocity: [0, 1611.913967132568359375], position: [300000, 300000], radius: 6000, mass: 1e29, color: '#ff0'},
                {velocity: [0, -1611.913967132568359375], position: [900000, 300000], radius: 6000, mass: 1e29, color: '#ff0'},
                {velocity: [1611.913967132568359375, 0], position: [600000, 600000], radius: 6000, mass: 1e29, color: '#ff0'},
                {velocity: [-1611.913967132568359375, 0], position: [600000, 0], radius: 6000, mass: 1e29, color: '#ff0'}
            ]);
            break;
        case 3:
            preset([
                {velocity: [0, 0], position: [6000000, 3000000], radius: 6960, mass: 6.642926e29, color:'#ff0'},
                {velocity: [0, 5234.45442451708230028402], position: [6197472, 3000000], radius: 3000, mass: 1.57368e27, color:'#f0f'},
                {velocity: [0, 4140.16034], position: [6315656, 3000000], radius: 3000, mass: 5.0054e27, color:'#0ff'}
            ]);
            break;
        case 4:
            preset([
                {velocity: [0, 0], position: [6000000, 3000000], radius: 6960, mass: 1.8895e30, color: '#ff0'},
                {velocity: [0, 9458.08492], position: [6172040, 3000000], radius: 3000, mass: 1.5623e27, color: '#f0f'},
                {velocity: [0, 6547.062824], position: [6359040, 3000000], radius: 3000, mass: 3.2042e26, color: '#0ff'},
                {velocity: [0, 3629.3312848], position: [7168376, 3000000], radius: 3000, mass: 2.7302e26, color: '#ff0'},
                {velocity: [0, 1335.25503], position: [14631920, 3000000], radius: 3000, mass: 7.2712e27, color: '#f0f'},
                {velocity: [0, 98.2827558], position: [1599240000, 3000000], radius: 3000, mass: 2.58557e29, color: '#ff0'}
            ]);
            break;
        case 5:
            preset([
                {velocity: [0, 0], position: [6000000, 3000000], radius: 6960, mass: 2.1082e30, color: '#ff0'},
                {velocity: [0, 14758.078936], position: [6078839, 3000000], radius: 3000, mass: 8.9491e26, color: '#f00'}
            ]);
            break;
        case 6:
            preset([
                {velocity: [0, 0], position: [6000000, 3000000], radius: 6960, mass: 2.148e30, color: '#ff0'},
                {velocity: [0, 2359.8596376], position: [9141600, 3000000], radius: 3000, mass: 4.79688e27, color: '#f0f'},
                {velocity: [0, 1802.37257], position: [11385600, 3000000], radius: 3000, mass: 1.02384e27, color: '#0ff'},
                {velocity: [0, 1004.0765516], position: [23353600, 3000000], radius: 3000, mass: 3.10944e27, color: '#f00'}
            ]);
            break;
        case 7:
            preset([
                {velocity: [0, 0], position: [6000000, 3000000], radius: 6960, mass: 2.5468e30, color: '#ff0'},
                {velocity: [0, 4082.38952], position: [7244672, 3000000], radius: 3000, mass: 3.6453e27, color: '#f0f'},
                {velocity: [0, 2341.07776], position: [9784880, 3000000], radius: 3000, mass: 7.8412e27, color: '#0ff'}
            ]);
            break;
        case 8:
            preset([
                // A "static" pyramid as defined by the following bodies will eventually acquire angular momentum
                // showing how errors in the integrator can build up to allow non-physical behavior
                // Eventually the angular momentum will increase to the point that outer bodies will be flung out
                // Pyramid constructed by setting a bottom row of bodies aligned on the x-axis,
                // rotating a radius vector [0, r] for bodies of radius r by -Math.PI / 6, multiplying 2,
                // then adding the new vector to the position vector of a body, stacking bodies as appropriate
                {velocity: [0, 0], position: [200000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [0, 0], position: [254000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [4555000, 0], position: [-9000000000, 450000], radius: 506400000, mass: 9.6e38, color: '#f00'},
                {velocity: [0, 0], position: [308000, 393530.7436087194], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [254000, 393530.7436087194], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [362000, 393530.7436087194], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [416000, 393530.7436087194], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [227000, 346765.3718043597], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [281000, 346765.3718043597], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [335000, 440296.1154130791], radius: 27000, mass: 3e28, color: '#0ff'},
                {velocity: [0, 0], position: [389000, 440296.1154130791], radius: 27000, mass: 3e28, color: '#0ff'},
                {velocity: [0, 0], position: [281000, 440296.1154130791], radius: 27000, mass: 3e28, color: '#0ff'},
                {velocity: [0, 0], position: [308000, 487061.4872174388], radius: 27000, mass: 3e28, color: '#0ff'},
                {velocity: [0, 0], position: [362000, 487061.4872174388], radius: 27000, mass: 3e28, color: '#0ff'},
                {velocity: [0, 0], position: [335000, 533826.8590217985], radius: 27000, mass: 3e28, color: '#0ff'},
                {velocity: [0, 0], position: [335000, 346765.3718043597], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [389000, 346765.3718043597], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [443000, 346765.3718043597], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [308000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [0, 0], position: [362000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [0, 0], position: [416000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [0, 0], position: [470000, 300000], radius: 27000, mass: 3e28, color: '#f00'}
            ]);
            break;
        case 13:
            preset([
                // Pyramid without the massive distant body
                {velocity: [0, 0], position: [200000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [0, 0], position: [254000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [0, 0], position: [308000, 393530.7436087194], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [254000, 393530.7436087194], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [362000, 393530.7436087194], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [416000, 393530.7436087194], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [227000, 346765.3718043597], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [281000, 346765.3718043597], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [335000, 440296.1154130791], radius: 27000, mass: 3e28, color: '#0ff'},
                {velocity: [0, 0], position: [389000, 440296.1154130791], radius: 27000, mass: 3e28, color: '#0ff'},
                {velocity: [0, 0], position: [281000, 440296.1154130791], radius: 27000, mass: 3e28, color: '#0ff'},
                {velocity: [0, 0], position: [308000, 487061.4872174388], radius: 27000, mass: 3e28, color: '#0ff'},
                {velocity: [0, 0], position: [362000, 487061.4872174388], radius: 27000, mass: 3e28, color: '#0ff'},
                {velocity: [0, 0], position: [335000, 533826.8590217985], radius: 27000, mass: 3e28, color: '#0ff'},
                {velocity: [0, 0], position: [335000, 346765.3718043597], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [389000, 346765.3718043597], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [443000, 346765.3718043597], radius: 27000, mass: 3e28, color: '#ff0'},
                {velocity: [0, 0], position: [308000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [0, 0], position: [362000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [0, 0], position: [416000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [0, 0], position: [470000, 300000], radius: 27000, mass: 3e28, color: '#f00'}
            ]);
            break;
        case 10:
            preset([
                {velocity: [0, 0], position: [0, 300000], radius: 80000, mass: 1e28, color: '#f0f'},
                {velocity: [-10000, 0], position: [800000, 300000], radius: 50000, mass: 5e20, color: '#ff0'},
                {velocity: [-10000, 0], position: [890000, 300000], radius: 40000, mass: 4e20, color: '#ff0'},
                {velocity: [-10000, 0], position: [960000, 300000], radius: 30000, mass: 3e20, color: '#ff0'},
                {velocity: [-10000, 0], position: [1010000, 300000], radius: 20000, mass: 2e20, color: '#ff0'},
                {velocity: [-10000, 0], position: [1040000, 300000], radius: 10000, mass: 1e20, color: '#ff0'}
            ]);
            break;
        case 11:
            preset([
                {velocity: [0, 0], position: [100000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [0, 0], position: [154000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [0, 0], position: [208000, 300000], radius: 27000, mass: 3e28, color: '#f00'},
                {velocity: [0, 0], position: [1000000, 300000], radius: 27000, mass: 3e28, color: '#ff0'}
            ]);
            break;
        case 9:
            // kepler 16 system
            angle = 0;
            angularVelocity = 2 * Math.PI / -335.20038425056584893598;
            globalFunc = function() {
                var vx = velX[0];
                var vy = velY[0];
                var px = posX[0] - globalOrigin[0];
                var py = posY[0] - globalOrigin[1];
                var velocity = Math.sqrt((vx * vx) + (vy * vy));
                var dist = Math.sqrt((px * px) + (py * py));
                angularVelocity = -velocity / dist;
            };
            globalOrigin = [500000, 300000];
            // NOTE: sqrt(GM[other]/2R) will get you a circular orbit around the common COM, but the COM will have some linear motion. Will have to compensate by
            //       subtracting the velocity of the COM from the two bodies
            //       The third body shouldn't need adjusting since it's orbital velocity was calculated in reference to the COM, which should then be stationary.
            preset([
                {velocity: [0, -1427.52795303998368297237], position: [423913.45703234486238017826, 300000], radius: 6000, mass: 1.37174433e30, color: '#ff0'},
                {velocity: [0, 4862.24823832120908357513], position: [759465.45703234486238017826, 300000], radius: 2000, mass: 4.02255025e29, color: '#ff0'},
                {velocity: [0, 3701.88107120123905059218], position: [1554380, 300000], radius: 500, mass: 6.3199999999999368e26, color: '#fff'}
            ]);
            break;
        default:
            clearBodies();
            break;
    }

    for (var i = 0; i < bodyCount; i++) {
        drawBody(posX[i], posY[i], radius[i], color[i], paper);
    }
}

window.onload = function() {
    isBounce = true;
    isPaused = false;
    isRotating = false;
    bodyCountDisplay = 0;
    alpha = 1;
    counts = 0;
    angle = 0;
    angularVelocity = 0;
    globalOrigin = [0, 0];
    globalFunc = function() {};
    var canvas = document.getElementById('canvas');
    windowWidth = getWidth();
    windowHeight = getHeight();
    canvas.width = windowWidth;
    canvas.height = windowHeight;
    var transition = document.getElementById('transition');
    transition.width = windowWidth;
    transition.height = windowHeight;
    paper = canvas.getContext('2d');
    rectDimensions = [0, 0, windowWidth * 1000, windowHeight * 1000];
    resetCanvas(rectDimensions, true);
    document.getElementById('canvas').onclick = addBodyClick;
    document.getElementById('geturl').onclick = getUrl;
    document.getElementById('choosebody').onchange = changeBody;
    var integratorSelect = document.getElementById('integrator');
    if (integratorSelect) {
        integratorSelect.value = integrator;
        integratorSelect.onchange = function(ev) {
            integrator = ev.target.value;
            var label = document.getElementById('integratorLabel');
            if (label) {
                label.innerHTML = 'Integrator: ' + integrator;
            }
        };
    }
    var dtInput = document.getElementById('dt');
    if (dtInput) {
        dtInput.value = '' + dt;
        dtInput.onchange = function(ev) {
            var next = parseFloat(ev.target.value);
            if (!isNaN(next) && isFinite(next) && next > 0) {
                dt = next;
                ev.target.value = '' + dt;
                var label = document.getElementById('dtLabel');
                if (label) {
                    label.innerHTML = 'dt: ' + dt;
                }
                var range = document.getElementById('dtRange');
                if (range) {
                    range.value = '' + dt;
                }
            }
        };
    }
    var dtRange = document.getElementById('dtRange');
    if (dtRange) {
        dtRange.value = '' + dt;
        dtRange.oninput = function(ev) {
            var next = parseFloat(ev.target.value);
            if (!isNaN(next) && isFinite(next) && next > 0) {
                dt = next;
                var label = document.getElementById('dtLabel');
                if (label) {
                    label.innerHTML = 'dt: ' + dt;
                }
                if (dtInput) {
                    dtInput.value = '' + dt;
                }
            }
        };
    }
    var softeningInput = document.getElementById('softening');
    if (softeningInput) {
        softeningInput.value = '' + softening;
        softeningInput.onchange = function(ev) {
            var next = parseFloat(ev.target.value);
            if (!isNaN(next) && isFinite(next) && next >= 0) {
                softening = next;
                softening2 = softening * softening;
                ev.target.value = '' + softening;
                var label = document.getElementById('softeningLabel');
                if (label) {
                    label.innerHTML = 'softening: ' + softening;
                }
                var range = document.getElementById('softeningRange');
                if (range) {
                    range.value = '' + softening;
                }
            }
        };
    }
    var softeningRange = document.getElementById('softeningRange');
    if (softeningRange) {
        softeningRange.value = '' + softening;
        softeningRange.oninput = function(ev) {
            var next = parseFloat(ev.target.value);
            if (!isNaN(next) && isFinite(next) && next >= 0) {
                softening = next;
                softening2 = softening * softening;
                var label = document.getElementById('softeningLabel');
                if (label) {
                    label.innerHTML = 'softening: ' + softening;
                }
                if (softeningInput) {
                    softeningInput.value = '' + softening;
                }
            }
        };
    }
    document.onkeypress = pageEvents;
    document.onkeydown = handleArrowEvents;
    if (canvas.addEventListener) {
        canvas.addEventListener('DOMMouseScroll', handleScroll, false);
        canvas.addEventListener('mousewheel', handleScroll, false);
    } else if (canvas.attachEvent) {
        canvas.attachEvent('onmousewheel', handleScroll);
    }
    window.onresize = resizeWindow;
    if (!!window.location.hash) {
        var bodiestring = window.location.hash.substring(1);
        var list = JSON.parse(bodiestring);
        counts = 0;
        initialEnergy = null;
        bodyCountDisplay = -1;
        clearBodies();
        for (var i = 0; i < list.length; i++) {
            var b = list[i];
            pushBody(b.position[0], b.position[1], b.velocity[0], b.velocity[1], b.mass, b.radius, b.color);
        }
    } else {
        loadBodies(1);
    }
    var label = document.getElementById('integratorLabel');
    if (label) {
        label.innerHTML = 'Integrator: ' + integrator;
    }
    var dtLabel = document.getElementById('dtLabel');
    if (dtLabel) {
        dtLabel.innerHTML = 'dt: ' + dt;
    }
    var softLabel = document.getElementById('softeningLabel');
    if (softLabel) {
        softLabel.innerHTML = 'softening: ' + softening;
    }
    scheduleNextFrame();
};
