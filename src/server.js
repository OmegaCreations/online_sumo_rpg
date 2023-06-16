const path = require('path');
const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;
const express = require('express');

const app = express();
const server = require("http").createServer(app);

const io = require("socket.io")(server);

const loadMap = require("./mapLoader");

async function main(){
    
    const map2D = await loadMap();
    
    io.on("connection", (socket) => { 
        console.log("User connected.");

        socket.emit('map', map2D);
    });

    app.use(express.static(publicPath));

    server.listen(port, ()=> {
        console.log(`Server is up on port ${port}.`);
    });
}



main();