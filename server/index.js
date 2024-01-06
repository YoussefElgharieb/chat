const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io")

require("dotenv").config();
const PORT = process.env.PORT;
const ORIGIN = process.env.ORIGIN;

// app set up
const app = express();
app.use(express.json())

const server = app.listen(PORT, () => {
    console.log(`listening to requests on PORT: ${PORT}`);
})

app.use(cors({ origin: ORIGIN }));



// socket    
let map = {}
let rooms = {}

const io = new Server(server, {
    cors: {
        origin: ORIGIN
    },
});

let names = ['ChuckleChamp', 'BanterBot', 'BananaSlip', 'TickleMonster', 'SneakyNinja', 'CaptainChuckles', 'Gigglesaurus', 'Snickerdoodle', 'LaughingLlama', 'Cheesequake', 'SirLaughsALot', 'CacklingCactus', 'PicklePuncher', 'ChuckNorrisChuckles', 'WittyKitty', 'QuirkMaster', 'Punslinger', 'HahaHarold', 'TicklishTaco', 'JoyfulJellyfish']

io.on('connection', (socket) => {

    socket.on('join', async (room, callback) => {
        if (rooms[room] && rooms[room].length == names.length) {
            callback(false)
        }
        else {
            // join 
            socket.join(room);

            // update map
            map[socket.id] = room;

            if (rooms[room] == undefined) {
                // create room
                rooms[room] = [socket.id]

                let chat = {
                    participants: [
                        {
                            socket: socket.id,
                            name: names[Math.floor(Math.random() * names.length)],
                            connected: true,
                        }
                    ],
                    messages: [],
                }

                // acknowledgement
                callback(chat);
            }
            else {
                // update room
                rooms[room].push(socket.id)

                // fetch chat
                let responses = [];
                try {
                    responses = await socket.timeout(1000).in(room).emitWithAck("get");
                }
                catch (err) {
                    console.log(err.message)
                }

                if (responses.length > 0) {
                    let chat = responses[0];
                    // update chat
                    chat.participants.push({
                        socket: socket.id,
                        name: (() => {
                            let temp = [...names]
                            for (let i = 0; i < chat.participants.length; i++) {
                                if (chat.participants[i].connected)
                                    temp.splice(temp.findIndex((name) => name == chat.participants[i].name), 1)
                            }
                            temp = temp[Math.floor(Math.random() * temp.length)]
                            return temp;

                        })(),
                        connected: true,
                    })

                    // acknowledgement
                    callback(chat);

                    // notify others
                    socket.in(room).emit('joined', chat.participants[chat.participants.length - 1])
                }
                else {
                    if (rooms[room] == undefined) {
                        // create room
                        rooms[room] = [socket.id]
                    }
                    let chat = {
                        participants: [
                            {
                                socket: socket.id,
                                name: names[Math.floor(Math.random() * names.length)],
                                connected: true,
                            }
                        ],
                        messages: [],
                    }

                    // acknowledgement
                    callback(chat);
                }

            }
        }
    })

    socket.on('send', (room, message) => {
        socket.in(room).emit('receive', message)
    })

    socket.on('disconnect', () => {

        let room = map[socket.id];
        delete map[socket.id];

        if (room) {
            // update room
            let index = rooms[room].indexOf(socket.id)
            rooms[room].splice(index, 1);

            // delete room
            if (rooms[room].length == 0) {
                delete rooms[room];
            }


            // update client
            socket.in(room).emit('left', socket.id)
        }
    })
})