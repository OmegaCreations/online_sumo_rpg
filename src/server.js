const path = require('path');
const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;
const express = require('express');

const app = express();
const server = require("http").createServer(app);

const io = require("socket.io")(server);

// loading map from mapLoader.js
const loadMap = require("./mapLoader");

// DATA
let players = [];
let snowballs = [];
let inputsMap = {};
let ground2D, decal2D;

// tick rate
const SPEED = 10.01;
const SNOWBALL_SPEED = 15.01;
const TICK_RATE = 120;
const PLAYER_SIZE = 80;
const TILE_SIZE = 80;

function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}

// reset player pos.
function resetPlayer(player){
    player.x = 40*80/2;
    player.y = 40*80/2;
}

function isColliding(rect1, rect2){
    return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.h + rect1.y > rect2.y
    );
}

function mapCollider(player, sizeX, sizeY){
    for(let row = 0; row < decal2D.length; row++){
        for(let col = 0; col < decal2D[0].length; col++){
            const tile = decal2D[row][col];
            if(tile && isColliding({
                ...player,
                x: player.x,
                y: player.y,
                w: sizeX,
                h: sizeY,
            },
            {
                x: col * TILE_SIZE,
                y: row * TILE_SIZE,
                w: TILE_SIZE,
                h: TILE_SIZE,
            })){
                console.log("collide.");
                return true;
            }
        }
    }
    return false;
}

function tick(delta){
    // player movement

    for(const player of players) {
        let previousPlayerX = player.x;
        let previousPlayerY = player.y;

        const inputs = inputsMap[player.id];
        if(inputs.up){
            player.y -= SPEED;
        } else if(inputs.down){
            player.y += SPEED;
        }

        if(mapCollider(player, 80, 80)){
            player.y = previousPlayerY;
        }

        if(inputs.left){
            player.x -= SPEED;
        } else if(inputs.right){
            player.x += SPEED;
        }

        if(mapCollider(player, 80, 80)){
            player.x = previousPlayerX;
        }

        // linear interpolation
        player.x = lerp(previousPlayerX, player.x, 1);
        player.y = lerp(previousPlayerY, player.y, 1);
    }

    // snowball movement
    for(const snowball of snowballs){
        snowball.x += Math.cos(snowball.angle) * SNOWBALL_SPEED;
        snowball.y += Math.sin(snowball.angle) * SNOWBALL_SPEED;
        snowball.TTL -= delta;

        if(mapCollider(snowball, 8, 8)){
            snowball.TTL = -1;
        }

        for(const player of players) {
            if(player.id === snowball.id) continue;
            const distance = Math.sqrt((player.x+PLAYER_SIZE/2 -snowball.x)**2 + (player.y+PLAYER_SIZE/2 -snowball.y)**2);
            if(distance <= PLAYER_SIZE/2) {
                resetPlayer(player);
                snowball.TTL = -1;
                break;
            }
        }
    }

    snowballs = snowballs.filter((snowball) => snowball.TTL > 0);

    io.emit('players', players);
    io.emit('snowballs', snowballs);
}

async function main(){
    
    ({ground2D, decal2D} = await loadMap());
    
    io.on("connection", (socket) => { 
        console.log("User connected - id: ", socket.id);

        inputsMap[socket.id] = {
            up: false,
            down: false,
            left: false,
            right: false,
        }

        players.push({
            id: socket.id,
            x: 40*80/2,
            y: 40*80/2,
        })

        // map render 
        socket.emit('map', {
            ground: ground2D,
            decal: decal2D,
        });

        // change movement inputs
        socket.on("inputs", (inputs) => {
            inputsMap[socket.id] = inputs;
        });

        // throw snowball
        socket.on("snowball", (angle) => {
            const player = players.find((player) => player.id === socket.id);
            
            snowballs.push({
                angle,
                x: player.x+40,
                y: player.y+40,
                TTL: 1000,
                id: socket.id,
            });
        });

        socket.on("disconnect", () => {
            players = players.filter((player) => player.id !== socket.id);
        });
    });

    app.use(express.static(publicPath));

    server.listen(port, ()=> {
        console.log(`Server is up on port ${port}.`);
    });

    let lastUpdate = Date.now();
    setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        tick(delta);
        lastUpdate = now;
    }, 1000 / TICK_RATE);
}



main();