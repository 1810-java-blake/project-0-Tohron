var mouse_x = 0;
var mouse_y = 0;
var mouse_moved = false;

var base_move = 3;
var b_move = 3;
var i_move = 4; // 50% more than base
var a_move = 6; // 100% more than base

var chuck;
var chuck_half_width = 50;
var chuck_speed = 8.0;
var chuck_move_x = 0.0;
var chuck_move_y = 0.0;
var prev_pos = [0,0];

var messageNumber = 2;
var messages = []; // approaching messages
var hit_messages = []; // messages that have been hit
var kicked_messages = [];
var fading_messages = []; // messages that reached the right side without being hit
class Message {
    constructor(div, x, y, h, s_val) {
        this.div = div;
        this.x = x;
        this.y = y;
        this.h = h;
        this.s_val = s_val;
    }
    finalizePos() {
        this.div.style.left = this.x + "px";
        this.div.style.top = this.y + "px";
    }
    finalizeHeight() {
        this.div.style.height = this.h + "px";
        this.div.style.lineHeight = this.h + "px";
    }
}

var jokeList = [];
var gettingJokes = false; // true when a batch of message texts is being retrieved

var repBar; // adjustable width
var repLabel; // changing text
var kickBar; // adjustable width
var pointLabel; // changing text
var dominationBar; // adjustable width

var isPunching = false;
var punchInterval = 500; // milliseconds
var punchCooldown = 0; // milliseconds until punch repeats
var kickQueued = false;
var kickInterval = 5000; // milliseconds
var kickCooldown = 0; // milliseconds until kick is available

var reputation = 20;
var repMax = 20;
var repTracker;
var score = 0;
var scoreTracker;
var level = 1;
var spawn_threshhold = .98;
var scoreThreshhold = 4000;
var domination = 0;
var dom_max = 1000;
var domTracker;
var domination_mode = false;

function ajax(url, success, failure) {
    let xhr = new XMLHttpRequest();

    // the "readyState" tells you the progress of
    // receiving the response.
    xhr.onreadystatechange = () => {
        //console.log(xhr.readyState);
        
        if (xhr.readyState === 4) {
            // we've received the full response.
            // it's a JSON string
            let resJSON = xhr.response;
            gettingJokes = false;
            if (xhr.status === 200) { // (success)
                let resObj = JSON.parse(resJSON);
                // use our callbacks
                success(resObj);
            } else {
                failure(resJSON, xhr.status);
            }
        }
    };

    // describing the request to be made
    xhr.open('GET', url);

    // construct and send the request
    xhr.send();
    // the next thing that'll happen is
    // readystatechange will fire a bunch of times
    console.log("end of ajax function.");
}

// Need mouse moved event
document.addEventListener("mousemove", event => {
    mouse_x = event.clientX; // x coord in document
    mouse_y = event.clientY; // y coord in document
    mouse_moved = true;
});

var box1;
var left;
var body, html, holder;
var width;
var height;
document.addEventListener("DOMContentLoaded", function() {
    /*
    box1 = document.getElementById("message1");
    var m = new Message(box1, parseInt(box1.style.left, 10), parseInt(box1.style.top, 10), 110);
    m.finalizeHeight();
    messages.push(m); // adds Message m to the end of messages
    */
    chuck = document.getElementById("chuck");
    kickBar = document.getElementById("kickfront");
    repTracker = document.getElementById("repspan");
    scoreTracker = document.getElementById("scorespan");
    domTracker = document.getElementById("dom_front");
    holder = document.getElementById("holder");
    //left = box1.style.left;
    body = document.body;
    html = document.documentElement;
    width = window.screenX;
    height = window.screenY;
    /*
    width = Math.max(body.scrollWidth, body.offsetWidth, 
        html.clientWidth, html.scrollWidth, html.offsetWidth);
    height = Math.max( body.scrollHeight, body.offsetHeight, 
        html.clientHeight, html.scrollHeight, html.offsetHeight );
        */
    jokeList.push("*Default Joke Here*")
    //SpawnMessage(); // Spawns extra message along with starting one
    setInterval(Update, 33); // updates game loop at 30 FPS
    isPunching = false;
    kickQueued = false;

    document.addEventListener("keypress", function(event) {
        //console.log("Key was pressed.");
        //console.log("Pressed: " + event.charCode); // Gives number code
        //console.log("Pressed: " + event.keyCode); // Gives lowercase char, Shift and Ctrl do not trigger event!
        if (event.key == "w") {
            //console.log("PUNCH!");
            isPunching = true;
        }
        if (event.key == "a") {
            //console.log("KICK!");
            kickQueued = true;
        }
        if (event.key == " ") {
            // console.log("Dominate!");
            if (domination >= dom_max) {
                domination_mode = true;
                holder.style.backgroundColor = "rgba(255, 0, 0, 0.6)";
                chuck_speed = 40 + 8 * level;
                b_move = parseInt(.25 * base_move + level);
                i_move = parseInt(.375 * (base_move + level));
                a_move = parseInt(.5 * (base_move + level));
            }
        }
    });
    document.addEventListener("keyup", function(event) {
        if (event.key == "w") {
            isPunching = false;
        }
        if (event.key == "a") {
            kickQueued = false;
        }
    });
});

/**
 * Handles Chuck movement, message movement(with removal detect), collision detection, message spawning, message removal,
 * punch/kick execution
 */
function Update() {
    width = window.innerWidth
    height = window.innerHeight;
    CheckLevel();
    //console.log("Bounds: " + width + ", " + height);
    if (jokeList.length < 10 && !gettingJokes) {
        AddJokes();
        gettingJokes = true;
    }
    if (jokeList.length > 0) {
        //console.log("X: " + mouse_x + ", Y: " + mouse_y); // works
        if (domination_mode) {
            if (domination > dom_max) {
                domination = dom_max;
            }
            if (domination <= 0) {
                domination_mode = false;
                holder.style.backgroundColor = "rgba(255, 0, 0, 0.0)";
                chuck_speed = 8 + 4 * level;
                b_move = base_move + level;
                i_move = parseInt(1.5 * (base_move + level));
                a_move = 2 * (base_move + level);
            }
            domination -= dom_max/150.0; // per 33 milliseconds, depletes from 1000 in 5 seconds
            UpdateDomination();
        }
        if (Math.random() > spawn_threshhold) {
            SpawnMessage();
        }

        if (mouse_moved) {
            SetChuckVector();
            mouse_moved = false;
        }
        MoveLeft();
        HandleCollision();

        Fade();
        Return();

        MoveChuck();
        
        HandleAttack();
    }
}

function CheckLevel() {
    if (score > scoreThreshhold) {
        level++;
        scoreThreshhold += 4000 * level;
        if (domination_mode) {
            chuck_speed = 40 + 8 * level;
            b_move = parseInt(.25 * base_move + level);
            i_move = parseInt(.375 * (base_move + level));
            a_move = parseInt(.5 * (base_move + level));
        } else {
            chuck_speed = 8 + 4 * level;
            b_move = base_move + level;
            i_move = parseInt(1.5 * (base_move + level));
            a_move = 2 * (base_move + level);
        }

        spawn_threshhold -= .01;
        repMax += 5;
        reputation += .2 * repMax;
        if (reputation > repMax) {
            reputation = repMax;
        }
        repTracker.innerHTML = "<strong>Reputation: " + reputation + " / " + repMax + "</strong>";
    }
}

function SetChuckVector() {
    // ISSUE: Pos is for top-left corner of image, not center of image!
    var chuck_x = mouse_x - parseInt(chuck.style.left, 10) - chuck_half_width;
    var chuck_y = mouse_y - parseInt(chuck.style.top, 10) - chuck_half_width;
    //console.log("CX: " + chuck_x + ", CY: " + chuck_y); // These are actual numbers
    var inv_scalar = Math.sqrt(Math.pow(chuck_x, 2) + Math.pow(chuck_y, 2));
    //console.log(inv_scalar);
    var scalar = chuck_speed / Math.abs(inv_scalar); // abs doesn't fix
    chuck_move_x = scalar * chuck_x;
    chuck_move_y = scalar * chuck_y;
    //console.log("Vector: " + chuck_move_x + ", " + chuck_move_y); // vector signs are correct
}
/**
 * Moves Chuck.  If collision occurs, moves as far as allowed, first vertically, then horizontally
 */
function MoveChuck() {
    var c_x = parseInt(chuck.style.left, 10);
    var c_y = parseInt(chuck.style.top, 10);
    prev_pos = [c_x, c_y];
    if (Math.abs(chuck_move_x) > Math.abs(mouse_x - c_x - chuck_half_width)) {
        chuck_move_x = mouse_x - c_x - chuck_half_width;
    }
    if (Math.abs(chuck_move_y) > Math.abs(mouse_y - c_y - chuck_half_width)) {
        chuck_move_y = mouse_y - c_y - chuck_half_width;
    }
    //*/
    c_x += chuck_move_x;
    c_y += chuck_move_y;

    // Push direction dependent on signs of chuck_move_y and chuck_move_x
    
    min_y = c_y;
    max_y = c_y + 100;
    max_x = prev_pos[0] + 75;
    var i;
    if (chuck_move_y > 0) {
        for (i = 0; i < messages.length; i++) {
            m = messages[i];
            // detects overlap
            if (m.y < max_y && m.y + m.h > min_y && m.x < max_x && m.x + 245 > prev_pos[0] + 25) {
                // pushes up if chuck_move_y > 0
                max_y = m.y;
            }
        }
        c_y = max_y - 101;
    } else {
        for (i = 0; i < messages.length; i++) {
            m = messages[i];
            // detects overlap
            if (m.y < max_y && m.y + m.h > min_y && m.x < max_x && m.x + 245 > prev_pos[0] + 25) {
                // pushes down if chuck_move_y < 0
                min_y = m.y + m.h;
            }
        }
        c_y = min_y + 1;
    }


    min_y = c_y;
    max_y = c_y + 100;
    max_x = c_x + 75;
    min_x = c_x + 25;
    if (chuck_move_x > 0) {
        for (i = 0; i < messages.length; i++) {
            m = messages[i];
            // detects overlap
            if (m.y < max_y && m.y + m.h > min_y && m.x < max_x && m.x + 245 > c_x + 25) {
                // pushes left if chuck_move_x > 0
                max_x = m.x;
            }
        }
        c_x = max_x - 75;
    } else {
        for (i = 0; i < messages.length; i++) {
            m = messages[i];
            // detects overlap
            if (m.y < max_y && m.y + m.h > min_y && m.x < max_x && m.x + 245 > c_x + 25) {
                // pushes right if chuck_move_x < 0
                min_x = m.x + 245;
            }
        }
        c_x = min_x - 25;
    }


    //console.log("CX: " + c_x + ", CY: " + c_y); // These are decimal numbers
    chuck.style.left  = c_x + "px";
    chuck.style.top  = c_y + "px";
}

function HandleAttack() {
    punchCooldown -= 33;
    kickCooldown -= 33;
    
    if (kickQueued && kickCooldown <= 0 && punchCooldown < .7 * punchInterval) {
        chuck.style.backgroundImage = "url('./Kick.png')";
        Kick();
        kickCooldown = kickInterval;
    } else if (isPunching && punchCooldown <= 0 && kickCooldown < .9 * kickInterval) {
        chuck.style.backgroundImage = "url('./Punch.png')";
        Punch();
        punchCooldown = punchInterval;
    } else if (kickCooldown < .9 * kickInterval && punchCooldown < .7 * punchInterval) {
        chuck.style.backgroundImage = "url('./Base.png')";
    }
    var barWidth = 85 * (1 -kickCooldown / kickInterval);
    if (barWidth > 85) {
        barWidth = 85;
    }
    kickBar.style.width = barWidth + "px";
}

function Punch() {
    var c_x = parseInt(chuck.style.left, 10) + 85; // 35px to the right of center
    var c_y = parseInt(chuck.style.top, 10) + 50;
    for (var i = 0; i < messages.length; i++) {
        var m = messages[i];
        if (m.y < c_y && m.y + m.h > c_y && m.x < c_x && m.x + 245 > c_x) {
            console.log("Punched!");
            score += messages[i].s_val;
            domination += messages[i].s_val;
            UpdateDomination();
            AddScore();
            messages[i].div.className = "message hit";
            hit_messages.push(messages[i]);
            messages.splice(i, 1);
            return;
        }
    }
}
function Kick() {
    var c_x = parseInt(chuck.style.left, 10) + 100; // 50px to the right of center
    var c_y = parseInt(chuck.style.top, 10) + 50;
    for (var i = 0; i < messages.length; i++) {
        var m = messages[i];
        if (m.y < c_y && m.y + m.h > c_y && m.x < c_x && m.x + 245 > c_x) {
            console.log("Kicked!");
            score += 2 * messages[i].s_val;
            domination += messages[i].s_val;
            UpdateDomination();
            AddScore();
            messages[i].div.className = "message kicked";
            kicked_messages.push(messages[i]);
            messages.splice(i, 1);
            return;
        }
    }
}

function AddScore() {
    scoreTracker.innerHTML = "<strong>Score<br>" + score + "</strong>";
    if (domination > dom_max) {
        domination = dom_max;
    }
}

function UpdateDomination() {
    if (domination > dom_max) {
        domination = dom_max;
    }
    domTracker.style.height = (250 * domination / dom_max) + "px";
}

// Moves Chuck left (after messages move) if needed
function HandleCollision() {
    var c_x = parseInt(chuck.style.left, 10) + 75; // using 50x100 collision box
    var c_y = parseInt(chuck.style.top, 10);
    min_y = c_y;
    max_y = c_y + 100;
    max_x = c_x;

    for (var i = 0; i < messages.length; i++) {
        var m = messages[i];
        //var m_x = parseInt(messages[i].style.left, 10);
        //var m_y = parseInt(messages[i].style.top, 10);
        //var m_h = parseInt(messages[i].style.lineHeight, 10);
        if (m.y < max_y && m.y + m.h > min_y && m.x < max_x && m.x + 245 > c_x - 50) {
            max_x = m.x;
            //console.log("Move Collision"); // unclear if knockback cause
        }
    }
    c_x = max_x - 75;
    chuck.style.left  = c_x + "px";
}

function AddJokes() {
    ajax(
        "http://api.icndb.com/jokes/random/10",
        obj => {
            //console.log(obj);
            // value is array with indices 0 - 9
            for (var i = 0; i < 10; i++) {
                //console.log("Adding Joke: " + obj.value[i].joke);
                jokeList.push(obj.value[i].joke);
            }
        },
        (res, status) => {
            console.log(`Failure, status ${status}`);
        }
    );
}

function SpawnMessage() {
    var message = document.createElement("div");
    message.id = "message" +  + messageNumber;
    var s_val = 0;
    var result = Math.random();
    if (result > .8) {
        message.className = "message advanced";
        s_val += 80;
    } else if (result > .5) {
        message.className = "message intermediate";
        s_val += 50;
    } else {
        message.className = "message basic"; // Modify later for types other than 'basic'
        s_val += 20;
    }
    var joke = jokeList.shift();
    s_val += parseInt(joke.length / 4);
    var h = (90 + joke.length / 2) + "px";
    message.innerHTML = "<span id = \"label1\">" + joke + "</span>";

    var m = new Message(message, width, 40 + Math.random() * (height - 180), 90 + joke.length / 2, s_val);
    
    //message.style.left = width + "px";
    //message.style.top = (70 + Math.random() * (height - 140) + "px");
    //message.style.height = h;
    //message.style.lineHeight = h; // works
    m.finalizePos();
    m.finalizeHeight();

    //message.style.left = 1400 + "px";
    //message.style.top = (20 + Math.random() * (700 - 40) + "px");
    // If span is not label1, css won't be used
    //message.setAttribute("style","height:" + h);
    //message.setAttribute("style","lineHeight:" + h);  // also doesn't work, and also resets positions to 0
    //message.height = h;
    //message.lineHeight = h;
    //console.log("Message height: " + m.h);
    //var body = document.getElementsByTagName("body")[0];
    var holder = document.getElementById("holder");
    holder.appendChild(message);
    //var text = document.getElementById("label1");
    //text.innerHTML = jokeList.shift();
    messageNumber++;

    messages.push(m);
}

/**
 * Moves all messages, and marks any that reach the end for removal.
 */
function MoveLeft() {
    for (var i = 0; i < messages.length; i++) {
        //var left = parseInt(messages[i].style.left, 10);
        var m = messages[i];
        if (m.div.classList.contains("advanced")) {
            m.x -= a_move;
        } else  if (m.div.classList.contains("intermediate")) {
            m.x -= i_move;
        } else {
            m.x -= b_move;
        }
        //m.x -= 2;
        //messages[i].x = left + "px";
        m.finalizePos();

        if (m.x < 0) {
            m.div.style.opacity = 1.0;
            fading_messages.push(m);
            messages.splice(i, 1);
            i--; // adjusts index back now that message was removed
            reputation--;
            repTracker.innerHTML = "<strong>Reputation: " + reputation + " / " + repMax + "</strong>";
            if (reputation <= 0) {
                window.location = "./gameover.html";
                return;
            }
        }
    }
    

    
}

function Fade() {
    //var holder = document.getElementById("holder");
    for (var i = 0; i < fading_messages.length; i++) {
        //var opacity = fading_messages[i].div.style.opacity;
        //opacity -= .04;
        //console.log("Opacity: " + opacity);
        fading_messages[i].div.style.opacity -= .04;
        if (fading_messages[i].div.style.opacity <= 0) {
            holder.removeChild(fading_messages[i].div);
            fading_messages.splice(i, 1);
            i--;
        }
    }
}

function Return() {
    var i;
    //var holder = document.getElementById("holder");
    for (i = 0; i < hit_messages.length; i++) {
        hit_messages[i].x += 3;
        hit_messages[i].finalizePos();
        if (hit_messages[i].x > width) {
            holder.removeChild(hit_messages[i].div);
            hit_messages.splice(i, 1);
            i--;
        }
    }
    for (i = 0; i < kicked_messages.length; i++) {
        var k = kicked_messages[i];
        k.x += 6;
        k.finalizePos();
        for (var j = 0; j < messages.length; j++) {
            var m = messages[j];
            if (Math.abs(k.x - m.x) < 245 && Math.abs(k.y - m.y) < (k.h + m.h) / 2) { // -- issue: includes much lower messages!!!
                console.log("Y Values: " + k.y + ", " + m.y); // m.y seems much too close
                console.log("Comparing: " + Math.abs(k.y - m.y) + " < " + (k.h + m.h) / 2); // y difference too small!!!!
                score += messages[j].s_val;
                domination += messages[j].s_val;
                UpdateDomination();
                AddScore();
                messages[j].div.className = "message hit";
                hit_messages.push(messages[j]);
                messages.splice(j, 1);
                j--;
            }
        }
        if (k.x > width) {
            holder.removeChild(k.div);
            kicked_messages.splice(i, 1);
            i--;
        }
    }
}