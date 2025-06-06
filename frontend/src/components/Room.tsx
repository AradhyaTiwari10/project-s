import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://project-s-production.up.railway.app";
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

    // Add auto-next functionality during connecting phase
    useEffect(() => {
        let intervalId: number;
        
        if (lobby) {
            intervalId = setInterval(() => {
                handleNext();
            }, 3000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [lobby, socket]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    };

    const cleanupPeerConnections = async () => {
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

    const handleNext = async () => {
        await cleanupPeerConnections();
        socket?.emit("next-user");
    };

    const handleExit = async () => {
        await cleanupPeerConnections();
        socket?.disconnect();
        onExit();
    };

    const sendMessage = async () => {
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
        const socket = io(BACKEND_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000
        });
        
        // Cleanup function to handle disconnection
        const cleanup = () => {
            if (socket) {
                socket.disconnect();
            }
        };

        socket.on('connect', () => {
            console.log("Socket connected");
        });

        socket.on('disconnect', () => {
            console.log("Socket disconnected");
        });

        socket.on('send-offer', async ({roomId}) => {
            console.log("sending offer");
            setLobby(false);
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" },
                    { urls: "stun:stun2.l.google.com:19302" },
                    { urls: "stun:stun3.l.google.com:19302" },
                    { urls: "stun:stun4.l.google.com:19302" },
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
                ],
                iceCandidatePoolSize: 10,
                bundlePolicy: "max-bundle",
                rtcpMuxPolicy: "require"
            });

            setSendingPc(pc);

            // Add local tracks to the peer connection
            if (localVideoTrack) {
                console.log("Adding local video track");
                pc.addTrack(localVideoTrack);
            }
            if (localAudioTrack) {
                console.log("Adding local audio track");
                pc.addTrack(localAudioTrack);
            }

            // Send our name immediately when connection starts
            socket.emit("chat-message", { 
                message: "", 
                senderName: name 
            });

            pc.onicecandidate = async (e) => {
                console.log("Sending ICE candidate");
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "sender",
                        roomId
                    });
                }
            };

            pc.onnegotiationneeded = async () => {
                console.log("Creating and sending offer");
                try {
                    const sdp = await pc.createOffer();
                    await pc.setLocalDescription(sdp);
                    socket.emit("offer", {
                        sdp,
                        roomId
                    });
                } catch (error) {
                    console.error("Error during negotiation:", error);
                }
            };
        });

        socket.on("offer", async ({roomId, sdp: remoteSdp}) => {
            console.log("received offer");
            setLobby(false);
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" },
                    { urls: "stun:stun2.l.google.com:19302" },
                    { urls: "stun:stun3.l.google.com:19302" },
                    { urls: "stun:stun4.l.google.com:19302" },
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
                ],
                iceCandidatePoolSize: 10,
                bundlePolicy: "max-bundle",
                rtcpMuxPolicy: "require"
            });
              
            await pc.setRemoteDescription(remoteSdp);
            const sdp = await pc.createAnswer();
            await pc.setLocalDescription(sdp);

            // Create a new MediaStream for remote tracks
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

            // Handle incoming tracks
            pc.ontrack = (event) => {
                console.log("Received track:", event.track.kind);
                if (event.streams && event.streams[0]) {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                }
                
                // Store tracks for cleanup
                if (event.track.kind === 'video') {
                    setRemoteVideoTrack(event.track);
                } else if (event.track.kind === 'audio') {
                    setRemoteAudioTrack(event.track);
                }
            };

            pc.onicecandidate = async (e) => {
                if (!e.candidate) {
                    return;
                }
                console.log("on ice candidate on receiving side");
                socket.emit("add-ice-candidate", {
                    candidate: e.candidate,
                    type: "receiver",
                    roomId
                });
            };

            socket.emit("answer", {
                roomId,
                sdp: sdp
            });
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

        // Return cleanup function
        return cleanup;
    }, [name, localAudioTrack, localVideoTrack]);

    // Separate useEffect for sending name when socket is ready
    useEffect(() => {
        if (socket && !lobby) {
            socket.emit("chat-message", { 
                message: "", 
                senderName: name 
            });
        }
    }, [socket, lobby, name]);

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
                localVideoRef.current.play();
            }
        }
    }, [localVideoRef])

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
            {/* Top Section with Videos */}
            <div className="flex flex-col md:flex-row gap-4 p-4 h-[70vh]">
                <div className="relative w-full md:w-1/2 h-full">
                    <video 
                        autoPlay 
                        playsInline
                        muted
                        ref={localVideoRef}
                        className="w-full h-full rounded-lg bg-black object-cover scale-x-[-1]"
                    />
                    <p className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
                        You ({name})
                    </p>
                </div>
                <div className="relative w-full md:w-1/2 h-full">
                    <video 
                        autoPlay 
                        playsInline
                        ref={remoteVideoRef}
                        className="w-full h-full rounded-lg bg-black object-cover scale-x-[-1]"
                        onLoadedMetadata={() => {
                            if (remoteVideoRef.current) {
                                remoteVideoRef.current.play().catch(console.error);
                            }
                        }}
                    />
                    <p className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
                        {strangerName}
                    </p>
                </div>
            </div>

            {/* Bottom Section with Controls and Chat */}
            <div className="flex flex-col md:flex-row flex-1 min-h-0">
                {/* Controls Section */}
                <div className="flex flex-row gap-4 p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 md:w-1/2 h-[30vh] items-center justify-center">
                    <button 
                        onClick={handleNext}
                        className="w-1/2 h-full relative inline-block text-xl font-bold uppercase tracking-wide text-white rounded-lg transition-all duration-700 ease-[cubic-bezier(.3,.7,.4,1)] active:translate-y-[6px] active:duration-34"
                         style={{ 
                            backgroundColor: '#5cb85c', // Green background
                            padding: '12px 27px',
                            boxShadow: '0 12px 0 0 #4cae4c', // Darker green shadow
                          }}
                    >
                         <span className="relative block translate-y-[-6px] transition-transform duration-1000 ease-[cubic-bezier(.3,.7,.4,1)] active:translate-y-[-2px] active:duration-34">
                           Next
                         </span>
                    </button>
                    <button 
                        onClick={handleExit}
                         className="w-1/2 h-full relative inline-block text-xl font-bold uppercase tracking-wide text-white rounded-lg transition-all duration-700 ease-[cubic-bezier(.3,.7,.4,1)] active:translate-y-[6px] active:duration-34"
                          style={{ 
                            backgroundColor: '#d9534f', // Red background
                            padding: '12px 27px',
                            boxShadow: '0 12px 0 0 #d43f3a', // Darker red shadow
                          }}
                    >
                         <span className="relative block translate-y-[-6px] transition-transform duration-1000 ease-[cubic-bezier(.3,.7,.4,1)] active:translate-y-[-2px] active:duration-34">
                            Exit
                         </span>
                    </button>
                </div>

                {/* Chat Section */}
                <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-gray-800 border-t dark:border-gray-700 md:border-l">
                    <div 
                        ref={chatContainerRef}
                        className="flex-1 p-4 overflow-y-auto flex flex-col gap-2"
                    >
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {msg.senderName}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {msg.timestamp}
                                    </span>
                                </div>
                                <div className={`max-w-[70%] px-3 py-2 rounded-lg ${
                                    msg.fromMe ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-white'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Write a message..."
                            className="flex-1 px-3 py-2 border dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                        <button 
                            onClick={sendMessage}
                            className="flex-shrink-0 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition whitespace-nowrap"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};