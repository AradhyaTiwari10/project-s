import { User } from "./UserManger";

let GLOBAL_ROOM_ID = 1;

interface Room {
    user1: User;
    user2: User;
}

export class RoomManager {
    private rooms: Map<string, Room>;
    private userToRoom: Map<string, string>;

    constructor() {
        this.rooms = new Map<string, Room>();
        this.userToRoom = new Map<string, string>();
    }

    createRoom(user1: User, user2: User) {
        const roomId = this.generate().toString();
        this.rooms.set(roomId, {
            user1, 
            user2,
        });

        this.userToRoom.set(user1.socket.id, roomId);
        this.userToRoom.set(user2.socket.id, roomId);

        user1.socket.emit("send-offer", {
            roomId
        });

        user2.socket.emit("send-offer", {
            roomId
        });
    }

    handleDisconnection(socketId: string) {
        const roomId = this.userToRoom.get(socketId);
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                const otherUser = room.user1.socket.id === socketId ? room.user2 : room.user1;
                otherUser.socket.emit("user-disconnected");
                this.rooms.delete(roomId);
                this.userToRoom.delete(room.user1.socket.id);
                this.userToRoom.delete(room.user2.socket.id);
            }
        }
    }

    disconnectUser(socketId: string) {
        this.handleDisconnection(socketId);
    }

    sendMessage(socketId: string, message: string, senderName: string) {
        const roomId = this.userToRoom.get(socketId);
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                const otherUser = room.user1.socket.id === socketId ? room.user2 : room.user1;
                otherUser.socket.emit("chat-message", { message, senderName });
            }
        }
    }

    onOffer(roomId: string, sdp: string, senderSocketid: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2: room.user1;
        receivingUser?.socket.emit("offer", {
            sdp,
            roomId
        });
    }
    
    onAnswer(roomId: string, sdp: string, senderSocketid: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2: room.user1;
        receivingUser?.socket.emit("answer", {
            sdp,
            roomId
        });
    }

    onIceCandidates(roomId: string, senderSocketid: string, candidate: any, type: "sender" | "receiver") {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2: room.user1;
        receivingUser.socket.emit("add-ice-candidate", ({candidate, type}));
    }

    generate() {
        return GLOBAL_ROOM_ID++;
    }

    getRoomId(socketId: string): string | undefined {
        return this.userToRoom.get(socketId);
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }
}