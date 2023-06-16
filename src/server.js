const path = require('path');
const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;
const express = require('express');

const app = express();
const server = require("http").createServer(app);

const io = require("socket.io")(server);

// loading map from mapLoader.js
const loadMap = require("./mapLoader");

// tick rate
const SPEED = 5;
const TICK_RATE = 30;

function tick(){
    for(const player of players) {
        const inputs = inputsMap[player.id];
        if(inputs.up){
            player.y -= SPEED;
        } else if(inputs.down){
            player.y += SPEED;
        }

        if(inputs.left){
            player.x -= SPEED;
        } else if(inputs.right){
            player.x += SPEED;
        }
    }

    io.emit('players', players);
}

let players = [];
let inputsMap = {};

async function main(){
    
    const map2D = await loadMap();
    
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
            x: 0,
            y: 0,
        })


        // map render 
        socket.emit('map', map2D);

        // change movement inputs
        socket.on("inputs", (inputs) => {
            inputsMap[socket.id] = inputs;
        });

        socket.on("disconnect", () => {
            players = players.filter((player) => player.id !== socket.id);
        });
    });

    app.use(express.static(publicPath));

    server.listen(port, ()=> {
        console.log(`Server is up on port ${port}.`);
    });

    setInterval(tick, 1000 / TICK_RATE);
}



main();