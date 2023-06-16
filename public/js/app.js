const mapImage = new Image();
mapImage.src = "./terrain.png";

const playerImage = new Image();
playerImage.src = "./player.png";

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");

const socket = io();

let map = [[]];
let players = [];
const TILE_SIZE = 16;

socket.on("connected", () => {
    console.log("connected.");
})

socket.on("map", (loadedMap) => {
    map = loadedMap;
});

// MOVEMENT
socket.on("players", (serverPlayers) => {
    players = serverPlayers;
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

// game loop
function loop(){
    canvas.clearRect(0, 0, canvas.width, canvas.height);

    const TILES_IN_ROW = 24;

    for(let row = 0; row < map.length; row++){
        for(let col = 0; col < map[0].length; col++){
            const { id } = map[row][col];
            const imageRow = parseInt(id / TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;

            canvas.drawImage(
                mapImage, 
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col*TILE_SIZE, 
                row*TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,

                );
        }
    }

    // drawing player
    for(const player of players) {
        canvas.drawImage(playerImage, player.x, player.y);
    }
    

    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);