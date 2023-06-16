// Assets
const mapImage = new Image();
mapImage.src = "./terrain.png";

const playerImage = new Image();
playerImage.src = "./player.png";

const walk = new Audio('./walk2.mp3');

// canvas
const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");

const socket = io();

let groundMap = [[]];
let decalMap = [[]];
let players = [];
let snowballs = [];
const TILE_SIZE = 5*16;

// connection
socket.on("connected", () => {
    console.log("connected.");
})

// Load map
socket.on("map", (loadedMap) => {
    groundMap = loadedMap.ground;
    decalMap = loadedMap.decal;
});

// PLAYER MOVEMENT
socket.on("players", (serverPlayers) => {
    players = serverPlayers;
});

// SNOWBALLS DATA
socket.on("snowballs", (serverSnowballs) => {
    snowballs = serverSnowballs;
});

const inputs = {
    'up': false,
    'down': false,
    'left': false,
    'right': false
}

window.addEventListener('keydown', (e) => {
    if(e.key === 'w'){
        inputs["up"] = true;
    } else if(e.key === 's'){
        inputs["down"] = true;
    }

    if(e.key === 'd'){
        inputs["right"] = true;
    } else if(e.key === 'a'){
        inputs["left"] = true;
    }
    if(['a', 'w', 's', 'd'].includes(e.key)){
        walk.play();
    }
    socket.emit("inputs", inputs);
});

window.addEventListener('keyup', (e) => {
    if(e.key === 'w'){
        inputs["up"] = false;
    } else if(e.key === 's'){
        inputs["down"] = false;
    }

    if(e.key === 'd'){
        inputs["right"] = false;
    } else if(e.key === 'a'){
        inputs["left"] = false;
    }


    socket.emit("inputs", inputs);
});

// SKILLS
window.addEventListener('click', (e) => {
    const angle = Math.atan2(e.clientY - canvasEl.height/2, e.clientX - canvasEl.width/2);
    socket.emit("snowball", angle);
});

// game loop
let true_cameraX = 0;
let true_cameraY = 0;
let cameraX = 0;
let cameraY = 0;
function loop(){
    canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const myPlayer = players.find((player) => player.id === socket.id);
    
    
    if(myPlayer) {
        // Camera position setup
        true_cameraX += (myPlayer.x - Math.round(canvasEl.width/2) - true_cameraX + 40)/40;
        true_cameraY += (myPlayer.y - canvasEl.height/2 - true_cameraY + 40)/40;

        cameraX = Math.round(true_cameraX);
        cameraY = Math.round(true_cameraY);
 
    }


    const TILES_IN_ROW = 24;

    // LEVEL 0 MAPPING - ground
    for(let row = 0; row < groundMap.length; row++){
        for(let col = 0; col < groundMap[0].length; col++){
            let { id } = groundMap[row][col] ?? {id: undefined};
            const groundRow = parseInt(id / TILES_IN_ROW);
            const groundCol = id % TILES_IN_ROW;

            canvas.drawImage(
                mapImage, 
                groundCol * TILE_SIZE,
                groundRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col*TILE_SIZE - cameraX, 
                row*TILE_SIZE - cameraY,
                TILE_SIZE,
                TILE_SIZE,

            );
        }
    }

    // LEVEL 1 MAPPING - decals
    for(let row = 0; row < decalMap.length; row++){
        for(let col = 0; col < decalMap[0].length; col++){
            let { id } = decalMap[row][col] ?? {id: undefined};
            const decalRow = parseInt(id / TILES_IN_ROW);
            const decalCol = id % TILES_IN_ROW;

            canvas.drawImage(
                mapImage, 
                decalCol * TILE_SIZE,
                decalRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col*TILE_SIZE - cameraX, 
                row*TILE_SIZE - cameraY,
                TILE_SIZE,
                TILE_SIZE,

            );
        }
    }

    // render player
    for(const player of players) {
        canvas.drawImage(playerImage, Math.round(player.x - true_cameraX), Math.round(player.y - true_cameraY));
    }
    
    // render snowballs
    for(const snowball of snowballs){
        canvas.fillStyle = "#FFF";
        canvas.beginPath();
        canvas.arc(snowball.x - cameraX, snowball.y - cameraY, 6, 0, 2* Math.PI);
        canvas.fill();
    }

    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);