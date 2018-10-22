var mouse_x = 0;
var mouse_y = 0;
var mouse_moved = false;

var chuck;
var chuck_half_width = 50;
var chuck_speed = 6.0;
var chuck_move_x = 0.0;
var chuck_move_y = 0.0;

var messages; // approaching messages
var hit_messages; // messages that have been hit
var fading_messages; // messages that reached the right side without being hit

var jokeList;
var gettingJokes = false; // true when a batch of message texts is being retrieved

var repBar; // adjustable width
var repLabel; // changing text
var kickBar; // adjustable width
var pointLabel; // changing text
var dominationBar; // adjustable width

var isPunching = false;
var punchInterval = 500; // milliseconds
var punchCooldown = 0; // milliseconds until punch repeats
var kickInterval = 5000; // milliseconds
var kickCooldown = 0; // milliseconds until kick is available

function ajax(url, success, failure) {
    let xhr = new XMLHttpRequest();

    // the "readyState" tells you the progress of
    // receiving the response.
    xhr.onreadystatechange = () => {
        console.log(xhr.readyState);
        // TODO: handle the response
        if (xhr.readyState === 4) {
            // we've received the full response.
            // it's a JSON string
            let resJSON = xhr.response;
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
    chuck = document.getElementById("chuck");
    left = box1.style.left;
    body = document.body;
    html = document.documentElement;
    width = Math.max(body.scrollWidth, body.offsetWidth, 
        html.clientWidth, html.scrollWidth, html.offsetWidth);
    height = Math.max( body.scrollHeight, body.offsetHeight, 
        html.clientHeight, html.scrollHeight, html.offsetHeight );

    SpawnMessage(); // ------------ WIP
});


function Update() {
    //console.log("X: " + mouse_x + ", Y: " + mouse_y); // works
    //console.log(box); // is found
    //console.log(box1.style.left  ); // PROBLEM: Blank
    left = parseInt(box1.style.left, 10);
    left -= 1;
    //console.log(left);
    box1.style.left  = left + "px";
    width = Math.max(body.scrollWidth, body.offsetWidth, 
        html.clientWidth, html.scrollWidth, html.offsetWidth);
    height = Math.max( body.scrollHeight, body.offsetHeight, 
        html.clientHeight, html.scrollHeight, html.offsetHeight );

    if (mouse_moved) {
        SetChuckVector();
        mouse_moved = false;
    }
    MoveChuck();
    HandleCollision();
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
//
function MoveChuck() {
    var c_x = parseInt(chuck.style.left, 10);
    var c_y = parseInt(chuck.style.top, 10);
    if (Math.abs(chuck_move_x) > Math.abs(mouse_x - c_x - chuck_half_width)) {
        chuck_move_x = mouse_x - c_x - chuck_half_width;
    }
    if (Math.abs(chuck_move_y) > Math.abs(mouse_y - c_y - chuck_half_width)) {
        chuck_move_y = mouse_y - c_y - chuck_half_width;
    }
    //*/
    c_x += chuck_move_x;
    c_y += chuck_move_y;
    //console.log("CX: " + c_x + ", CY: " + c_y); // These are decimal numbers
    chuck.style.left  = c_x + "px";
    chuck.style.top  = c_y + "px";
}
// sets max x, max y, and min y, then moves Chuck if needed
// ------------- NOTE: needs appropriate array to iterate through
function HandleCollision() {
    min_y = 0;
    max_y = height;
    max_x = width;


}

function SpawnMessage() {
    var text = document.getElementById("label1");
    // -------------------------------------- Is this asynchronous???  Could a for-loop be ran?
    ajax(
        "http://api.icndb.com/jokes/random/",
        obj => {
            console.log(obj);
            text.innerHTML = obj.value.joke; // There is a substantial delay here!  Perhaps a queue of texts would help?
        },
        (res, status) => {
            console.log(`Failure, status ${status}`);
        }
    );
}

function MoveLeft(box) {
    var pos_x = box.style.left;
    //pos_x -= // needs to get speed from combo of class and global scalar!!!
    box.style.left = pos_x + "px";
}

function Fade(box) {

}

setInterval(Update, 33); // updates game loop at 30 FPS

