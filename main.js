var mouse_x = 0;
var mouse_y = 0;
var mouse_moved = false;

var chuck;
var chuck_half_width = 50;
var chuck_speed = 8.0;
var chuck_move_x = 0.0;
var chuck_move_y = 0.0;
var prev_pos = [0,0];

var messageNumber = 2;
var messages = []; // approaching messages
var hit_messages = []; // messages that have been hit
var fading_messages = []; // messages that reached the right side without being hit
class Message {
    constructor(div, x, y, h) {
        this.div = div;
        this.x = x;
        this.y = y;
        this.h = h;
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
var body, html;
var width;
var height;
document.addEventListener("DOMContentLoaded", function() {
    box1 = document.getElementById("message1");
    var m = new Message(box1, parseInt(box1.style.left, 10), parseInt(box1.style.top, 10), 110);
    m.finalizeHeight();
    messages.push(m); // adds Message m to the end of messages
    chuck = document.getElementById("chuck");
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
    SpawnMessage(); // Spawns extra message along with starting one
    setInterval(Update, 33); // updates game loop at 30 FPS

    document.addEventListener("keypress", function(event) { // -------------- Keeps triggering as long as key down
        //console.log("Key was pressed.");
        //console.log("Pressed: " + event.charCode); // Gives number code
        //console.log("Pressed: " + event.keyCode); // Gives lowercase char, Shift and Ctrl do not trigger event!
        isPunching = false;
        kickQueued = false;
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
    //console.log("Bounds: " + width + ", " + height);
    if (jokeList.length < 10 && !gettingJokes) {
        AddJokes();
        gettingJokes = true;
    }
    if (jokeList.length > 0) {
        //console.log("X: " + mouse_x + ", Y: " + mouse_y); // works
        //console.log(box); // is found
        //console.log(box1.style.left  ); // PROBLEM: Blank
        if (Math.random() > .98) {
            //console.log(Math.random()); // is reached
            SpawnMessage();
        }
        //left = parseInt(box1.style.left, 10);
        //left -= 1;
        //console.log(left);
        //box1.style.left  = left + "px";

        if (mouse_moved) {
            SetChuckVector();
            mouse_moved = false;
        }
        MoveLeft();
        HandleCollision();
        MoveChuck();
        
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

    
    min_y = c_y;
    max_y = c_y + 100;
    max_x = c_x + 75;
    var i;
    for (i = 0; i < messages.length; i++) {
        if (m.y < max_y && m.y + m.h > min_y && m.x < max_x && m.x + 245 > prev_pos[0] + 25) {
            
        }
    }

    min_x = c_x + 25;
    for (i = 0; i < messages.length; i++) {
        if (m.y < max_y && m.y + m.h > min_y && m.x < max_x && m.x + 245 > c_x + 25) {
            max_x = m.x;
        }
    }

    //console.log("CX: " + c_x + ", CY: " + c_y); // These are decimal numbers
    chuck.style.left  = c_x + "px";
    chuck.style.top  = c_y + "px";
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
    var result = Math.random();
    if (result > .8) {
        message.className = "message advanced";
    } else if (result > .5) {
        message.className = "message intermediate";
    } else {
        message.className = "message basic"; // Modify later for types other than 'basic'
    }
    var joke = jokeList.shift();
    var h = (90 + joke.length / 2) + "px";
    message.innerHTML = "<span id = \"label1\">" + joke + "</span>";

    var m = new Message(message, width, 60 + Math.random() * (height - 180), 90 + joke.length / 2);
    
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
    console.log("Message height: " + m.h);
    //var body = document.getElementsByTagName("body")[0];
    var body = document.getElementById("holder");
    body.appendChild(message);
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
        messages[i].x -= 2;
        //messages[i].x = left + "px";
        messages[i].finalizePos();

        if (left < messages[i].div.width / 2) {
            fading_messages.push(messages[i]);
            messages.splice(i, 1);
            i--; // adjusts index back now that message was removed
        }
    }
    

    
}

function Fade() {
    for (var i = 0; i < fading_messages.length; i++) {

    }
}

function Return() {
    for (var i = 0; i < hit_messages.length; i++) {

    }
}