import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";

const URL = "https://project-s-production.up.railway.app/";
// const URL = "http://localhost:3000/";


interface Message {
    text: string;
    fromMe: boolean;
    timestamp: string;
    senderName: string;
}

export const Room = ({
    name,
    localAudioTrack,
    localVideoTrack,
    onExit
}: {
    name: string,
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null,
    onExit: () => void
}) => {
    const [lobby, setLobby] = useState(true);
    const [socket, setSocket] = useState<null | Socket>(null);
    const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
    const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [strangerName, setStrangerName] = useState<string>("Connecting...");
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    };

    const cleanupPeerConnections = () => {
        if (sendingPc) {
            sendingPc.close();
            setSendingPc(null);
        }
        if (receivingPc) {
            receivingPc.close();
            setReceivingPc(null);
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        setLobby(true);
        setMessages([]);
        setStrangerName("Connecting...");
    };

    const handleNext = () => {
        cleanupPeerConnections();
        socket?.emit("next-user");
    };

    const handleExit = () => {
        cleanupPeerConnections();
        socket?.disconnect();
        onExit();
    };

    const sendMessage = () => {
        if (inputMessage.trim() && socket) {
            const newMessage: Message = {
                text: inputMessage,
                fromMe: true,
                timestamp: formatTime(new Date()),
                senderName: name
            };
            socket.emit("chat-message", { 
                message: inputMessage,
                senderName: name 
            });
            setMessages(prev => [...prev, newMessage]);
            setInputMessage("");
        }
    };

    useEffect(() => {
        const socket = io(URL);
        socket.on('send-offer', async ({roomId}) => {
            console.log("sending offer");
            setLobby(false);
            const pc = new RTCPeerConnection({
                iceServers: [
                  { urls: "stun:stun.l.google.com:19302" }, // Free public STUN server
                  {
                    urls: "turn:relay.metered.ca:80",
                    username: "openai",
                    credential: "openai"
                  },
                  {
                    urls: "turn:relay.metered.ca:443",
                    username: "openai",
                    credential: "openai"
                  },
                  {
                    urls: "turn:relay.metered.ca:443?transport=tcp",
                    username: "openai",
                    credential: "openai"
                  }
                ]
              });
              

            setSendingPc(pc);
            if (localVideoTrack) {
                console.error("added tack");
                console.log(localVideoTrack)
                pc.addTrack(localVideoTrack)
            }
            if (localAudioTrack) {
                console.error("added tack");
                console.log(localAudioTrack)
                pc.addTrack(localAudioTrack)
            }

            // Send our name immediately when connection starts
            socket.emit("chat-message", { 
                message: "", 
                senderName: name 
            });

            pc.onicecandidate = async (e) => {
                console.log("receiving ice candidate locally");
                if (e.candidate) {
                   socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "sender",
                    roomId
                   })
                }
            }

            pc.onnegotiationneeded = async () => {
                console.log("on negotiation neeeded, sending offer");
                const sdp = await pc.createOffer();
                //@ts-ignore
                pc.setLocalDescription(sdp)
                socket.emit("offer", {
                    sdp,
                    roomId
                })
            }
        });

        socket.on("offer", async ({roomId, sdp: remoteSdp}) => {
            console.log("received offer");
            setLobby(false);
            const pc = new RTCPeerConnection({
                iceServers: [
                  { urls: "stun:stun.l.google.com:19302" }, // Free public STUN server
                  {
                    urls: "turn:relay.metered.ca:80",
                    username: "openai",
                    credential: "openai"
                  },
                  {
                    urls: "turn:relay.metered.ca:443",
                    username: "openai",
                    credential: "openai"
                  },
                  {
                    urls: "turn:relay.metered.ca:443?transport=tcp",
                    username: "openai",
                    credential: "openai"
                  }
                ]
              });
              
            pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer();
            //@ts-ignore
            pc.setLocalDescription(sdp)
            const stream = new MediaStream();
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }

            // Send our name immediately when connection starts
            socket.emit("chat-message", { 
                message: "", 
                senderName: name 
            });

            setRemoteMediaStream(stream);
            setReceivingPc(pc);
            // @ts-ignore
            window.pcr = pc;
            pc.ontrack = (e) => {
                alert("ontrack");
            }

            pc.onicecandidate = async (e) => {
                if (!e.candidate) {
                    return;
                }
                console.log("omn ice candidate on receiving seide");
                if (e.candidate) {
                   socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "receiver",
                    roomId
                   })
                }
            }

            socket.emit("answer", {
                roomId,
                sdp: sdp
            });
            setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track
                const track2 = pc.getTransceivers()[1].receiver.track
                console.log(track1);
                if (track1.kind === "video") {
                    setRemoteAudioTrack(track2)
                    setRemoteVideoTrack(track1)
                } else {
                    setRemoteAudioTrack(track1)
                    setRemoteVideoTrack(track2)
                }
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track1)
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track2)
                //@ts-ignore
                remoteVideoRef.current.play();
            }, 5000)
        });

        socket.on("answer", ({roomId, sdp: remoteSdp}) => {
            setLobby(false);
            setSendingPc(pc => {
                pc?.setRemoteDescription(remoteSdp)
                return pc;
            });
            console.log("loop closed");
        })

        socket.on("lobby", () => {
            setLobby(true);
            setStrangerName("Connecting...");
        })

        socket.on("add-ice-candidate", ({candidate, type}) => {
            console.log("add ice candidate from remote");
            console.log({candidate, type})
            if (type == "sender") {
                setReceivingPc(pc => {
                    if (!pc) {
                        console.error("receicng pc nout found")
                    } else {
                        console.error(pc.ontrack)
                    }
                    pc?.addIceCandidate(candidate)
                    return pc;
                });
            } else {
                setSendingPc(pc => {
                    if (!pc) {
                        console.error("sending pc nout found")
                    } else {
                    }
                    pc?.addIceCandidate(candidate)
                    return pc;
                });
            }
        })

        socket.on("chat-message", ({ message, senderName }) => {
            if (senderName) {
                setStrangerName(senderName);
            }
            if (message) {
                const newMessage: Message = {
                    text: message,
                    fromMe: false,
                    timestamp: formatTime(new Date()),
                    senderName: senderName || "Stranger"
                };
                setMessages(prev => [...prev, newMessage]);
            }
        });

        socket.on("user-disconnected", () => {
            handleNext();
        });

        setSocket(socket)
    }, [name])

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
                localVideoRef.current.play();
            }
        }
    }, [localVideoRef])

    return (
        <div className="flex flex-col items-center gap-4 p-4 bg-gray-100 min-h-screen">
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-[824px]">
                <div className="relative w-full md:w-1/2">
                    <video 
                        autoPlay 
                        playsInline
                        muted
                        ref={localVideoRef}
                        className="w-full h-[300px] rounded-lg bg-black object-cover"
                    />
                    <p className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
                        You ({name})
                    </p>
                </div>
                <div className="relative w-full md:w-1/2">
                    <video 
                        autoPlay 
                        playsInline
                        ref={remoteVideoRef}
                        className="w-full h-[300px] rounded-lg bg-black object-cover"
                    />
                    <p className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
                        {strangerName}
                    </p>
                </div>
            </div>
            
            <div className="flex gap-2 w-full max-w-[824px] justify-center">
                <button 
                    onClick={handleNext}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                    Next
                </button>
                <button 
                    onClick={handleExit}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                >
                    Exit
                </button>
            </div>

            <div className="w-full max-w-[824px] bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">Chat</h2>
                </div>
                <div 
                    ref={chatContainerRef}
                    className="h-[300px] p-4 overflow-y-auto flex flex-col gap-2"
                >
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm text-gray-500">
                                    {msg.senderName}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {msg.timestamp}
                                </span>
                            </div>
                            <div className={`max-w-[70%] px-3 py-2 rounded-lg ${
                                msg.fromMe ? 'bg-blue-500 text-white' : 'bg-gray-100'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                        />
                        <button 
                            onClick={sendMessage}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition whitespace-nowrap"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};