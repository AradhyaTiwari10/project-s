import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
    socket: Socket;
    name: string;
}

export class UserManager {
    private users: User[];
    private queue: string[];
    private roomManager: RoomManager;
    
    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager();
    }

    addUser(name: string, socket: Socket) {
        this.users.push({
            name, socket
        });
        this.queue.push(socket.id);
        socket.emit("lobby");
        this.clearQueue();
        this.initHandlers(socket);
    }

    removeUser(socketId: string) {
        const user = this.users.find(x => x.socket.id === socketId);
        if (user) {
            this.roomManager.handleDisconnection(socketId);
        }
        this.users = this.users.filter(x => x.socket.id !== socketId);
        this.queue = this.queue.filter(x => x === socketId);
    }

    clearQueue() {
        if (this.queue.length < 2) {
            return;
        }

        const id1 = this.queue.pop();
        const id2 = this.queue.pop();
        const user1 = this.users.find(x => x.socket.id === id1);
        const user2 = this.users.find(x => x.socket.id === id2);

        if (!user1 || !user2) {
            return;
        }

        if (user1.socket.id === user2.socket.id) {
            if (id1) {
                this.queue.push(id1);
            }
            return;
        }

        const room = this.roomManager.createRoom(user1, user2);
        this.clearQueue();
    }

    initHandlers(socket: Socket) {
        socket.on("offer", ({sdp, roomId}: {sdp: string, roomId: string}) => {
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });

        socket.on("answer",({sdp, roomId}: {sdp: string, roomId: string}) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });

        socket.on("add-ice-candidate", ({candidate, roomId, type}) => {
            this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
        });

        socket.on("next-user", () => {
            // First disconnect the current user
            this.roomManager.disconnectUser(socket.id);
            
            // Get the room ID before disconnecting
            const roomId = this.roomManager.getRoomId(socket.id);
            if (roomId) {
                const room = this.roomManager.getRoom(roomId);
                if (room) {
                    // Also disconnect the other user in the room
                    const otherUser = room.user1.socket.id === socket.id ? room.user2 : room.user1;
                    this.roomManager.disconnectUser(otherUser.socket.id);
                    // Add both users back to the queue
                    this.queue.push(socket.id);
                    this.queue.push(otherUser.socket.id);
                    // Notify both users they're back in lobby
                    socket.emit("lobby");
                    otherUser.socket.emit("lobby");
                }
            } else {
                // If no room found, just add this user back to queue
                this.queue.push(socket.id);
                socket.emit("lobby");
            }
            
            // Clear the queue to potentially match users
            this.clearQueue();
        });

        socket.on("chat-message", ({ message, senderName }) => {
            const user = this.users.find(x => x.socket.id === socket.id);
            if (user) {
                this.roomManager.sendMessage(socket.id, message, senderName || user.name);
            }
        });
    }
}