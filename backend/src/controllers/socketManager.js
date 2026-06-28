import { Server } from "socket.io"

let connections = {}
let messages = {}
let timeOnline = {}
let roomHosts = {} // Track host per room
let roomParticipants = {} // Track participant names per room

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        socket.on("join-call", (path, userName) => {

            socket.username = userName || "Guest";
            socket.roomPath = path;

            // Initialize room participants tracking
            if (!roomParticipants[path]) {
                roomParticipants[path] = {};
            }

            // First person in room is host
            if (!connections[path] || connections[path].length === 0) {
                socket.isHost = true;
                roomHosts[path] = socket.id;
            } else {
                socket.isHost = false;
            }

            // Store participant name
            roomParticipants[path][socket.id] = socket.username;

            if (connections[path] === undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id)

            timeOnline[socket.id] = new Date();

            // Broadcast updated participants list to everyone in the room
            const broadcastParticipants = () => {
                io.to(path).emit("update-participants", roomParticipants[path]);
            };

            // Notify everyone about new user
            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", 
                    socket.id, 
                    connections[path], 
                    socket.username, 
                    socket.isHost,
                    roomHosts[path] // Tell who is host
                )
            }

            // Send updated participants list to all
            broadcastParticipants();

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", 
                        messages[path][a]['data'],
                        messages[path][a]['sender'], 
                        messages[path][a]['socket-id-sender']
                    )
                }
            }
        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                    return [room, isFound];
                }, ['', false]);

            if (found) {
                if (messages[matchingRoom] === undefined) messages[matchingRoom] = []
                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }
        })

        socket.on("send-reaction", (reaction) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                    return [room, isFound];
                }, ['', false]);

            if (found) {
                connections[matchingRoom].forEach((elem) => {
                    if (elem !== socket.id) {
                        io.to(elem).emit("reaction-received", reaction, socket.username, socket.id);
                    }
                });
            }
        });

        socket.on("raise-hand", () => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                    return [room, isFound];
                }, ['', false]);

            if (found) {
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("hand-raised", socket.username, socket.id);
                });
            }
        });

        socket.on("lower-hand", () => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                    return [room, isFound];
                }, ['', false]);

            if (found) {
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("hand-lowered", socket.id);
                });
            }
        });

        socket.on("end-meeting", (path) => {
            if (connections[path]) {
                connections[path].forEach(clientId => {
                    io.to(clientId).emit("meeting-ended");
                });
                delete connections[path];
                delete messages[path];
                delete roomHosts[path];
                delete roomParticipants[path];
            }
        });

        socket.on("disconnect", () => {
            var key
            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k
                        
                        // Remove participant from tracking
                        if (roomParticipants[key] && roomParticipants[key][socket.id]) {
                            delete roomParticipants[key][socket.id];
                        }
                        
                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id)
                        }
                        
                        // Broadcast updated participants list
                        if (roomParticipants[key]) {
                            io.to(key).emit("update-participants", roomParticipants[key]);
                        }
                        
                        var index = connections[key].indexOf(socket.id)
                        connections[key].splice(index, 1)
                        
                        // If host left, assign new host
                        if (roomHosts[key] === socket.id && connections[key]?.length > 0) {
                            roomHosts[key] = connections[key][0];
                            // Notify everyone about new host
                            connections[key].forEach(clientId => {
                                io.to(clientId).emit("host-changed", roomHosts[key]);
                            });
                        }
                        
                        if (connections[key]?.length === 0) {
                            delete connections[key]
                            delete roomHosts[key]
                            delete roomParticipants[key]
                        }
                    }
                }
            }
        })
    })

    return io;
}