const express = require("express");
const app = express();
const http = require("http");
const { emit } = require("process");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);

let userID = 0; 
const id = ()=>{userID++;return userID;}
let usersList = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
   
io.on("connection",(socket)=>{
    let userName = "User "+id();
    usersList.push(userName);
    console.log("user "+userName+" connected")

    socket.broadcast.emit("new connection", userName)
    socket.emit("new name", null ,userName);
    
    socket.on('message', (msg)=>{
        console.log("user "+userName+" talked");
        socket.broadcast.emit("new message", userName+" : "+msg);
    });
    
    socket.on('is typing', ()=>{
        console.log("user "+userName+"  started typing");
        socket.broadcast.emit("new typer", userName);
    });

    socket.on('stopped typing', ()=>{
        console.log("user "+userName+" stopped typing");
        socket.broadcast.emit("typing stopped", userName);
    });

    socket.on('name change', (msg)=>{
        while(usersList.indexOf(msg)!=-1)
            msg=msg+"‎";
        console.log("user "+userName+" became "+msg);
        
        usersList[usersList.indexOf(userName)] = msg;
        socket.emit("new name", userName, msg);
        socket.broadcast.emit("new name change", userName, msg);
    
        //We change the value last to have access to the previous name before
        userName = msg;
        

    });

    socket.on('get connected', ()=>{
        //We transform the user list in a string to send it
        let nameList = usersList.reduce(
            (usersString,user)=> usersString + ((user==userName)? (`${user} (You)\n`) : (user+"\n")) ,"");
        socket.emit("connected list", ""+nameList);
    })
    
    socket.on('disconnect', ()=>{
        usersList = usersList.filter((x)=>x!=userName);
        console.log("user "+userName+" disconnected");
        socket.broadcast.emit("disconnection", userName);
    });
    
});
server.listen(3000, ()=>{
    console.log("App started. Using port 3000")
})