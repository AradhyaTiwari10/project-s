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

            // Add listeners for sendingPc
            pc.onconnectionstatechange = () => console.log("SendingPC: Connection state change:", pc.connectionState);
            pc.oniceconnectionstatechange = () => console.log("SendingPC: ICE connection state change:", pc.iceConnectionState);
            pc.onicegatheringstatechange = () => console.log("SendingPC: ICE gathering state change:", pc.iceGatheringState);
            pc.onsignalingstatechange = () => console.log("SendingPC: Signaling state change:", pc.signalingState);

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
                console.log("SendingPC: onicecandidate event", e.candidate);
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "sender",
                        roomId
                    });
                }
            };

            pc.onnegotiationneeded = async () => {
                console.log("SendingPC: onnegotiationneeded");
                try {
                    const sdp = await pc.createOffer();
                    await pc.setLocalDescription(sdp);
                    console.log("SendingPC: Offer created and local description set", sdp);
                    socket.emit("offer", {
                        sdp,
                        roomId
                    });
                } catch (error) {
                    console.error("SendingPC: Error during createOffer/setLocalDescription:", error);
                }
            };
        });

        socket.on("offer", async ({roomId, sdp: remoteSdp}) => {
            console.log("Received offer for room:", roomId);
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

            // Add listeners for receivingPc
            pc.onconnectionstatechange = () => console.log("ReceivingPC: Connection state change:", pc.connectionState);
            pc.oniceconnectionstatechange = () => console.log("ReceivingPC: ICE connection state change:", pc.iceConnectionState);
            pc.onicegatheringstatechange = () => console.log("ReceivingPC: ICE gathering state change:", pc.iceGatheringState);
            pc.onsignalingstatechange = () => console.log("ReceivingPC: Signaling state change:", pc.signalingState);
              
            try {
                await pc.setRemoteDescription(remoteSdp);
                console.log("ReceivingPC: Remote description (offer) set", remoteSdp);
                const sdp = await pc.createAnswer();
                await pc.setLocalDescription(sdp);
                console.log("ReceivingPC: Answer created and local description set", sdp);

                // Create a new MediaStream for remote tracks
                const currentRemoteStream = new MediaStream();
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = currentRemoteStream;
                }
                setRemoteMediaStream(currentRemoteStream); // So it can be cleaned up

                // Send our name immediately when connection starts
                socket.emit("chat-message", {
                    message: "",
                    senderName: name
                });

                setReceivingPc(pc);

                // Handle incoming tracks
                pc.ontrack = (event) => {
                    console.log("ReceivingPC: ontrack event", event);
                    console.log(`ReceivingPC: Track kind: ${event.track.kind}, id: ${event.track.id}, streams:`, event.streams);
                    if (currentRemoteStream) {
                        currentRemoteStream.addTrack(event.track);
                    }

                    // Attempt to play video when track is received
                    if (event.track.kind === 'video' && remoteVideoRef.current && remoteVideoRef.current.paused) {
                        remoteVideoRef.current.play().catch(error => console.error("Remote video play failed:", error));
                    }

                    // Store tracks for cleanup (optional, as stream itself is stored)
                    if (event.track.kind === 'video') {
                        setRemoteVideoTrack(event.track);
                    } else if (event.track.kind === 'audio') {
                        setRemoteAudioTrack(event.track);
                    }
                };

                pc.onicecandidate = async (e) => {
                    console.log("ReceivingPC: onicecandidate event", e.candidate);
                    if (!e.candidate) {
                        return;
                    }
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
            } catch (error) {
                console.error("ReceivingPC: Error during setRemoteDescription/createAnswer/setLocalDescription:", error);
            }
        });

        socket.on("answer", async ({roomId, sdp: remoteSdp}) => {
            console.log("Received answer for room:", roomId);
            setLobby(false);
            setSendingPc(pc => {
                if (pc) {
                    pc.setRemoteDescription(remoteSdp)
                        .then(() => console.log("SendingPC: Remote description (answer) set", remoteSdp))
                        .catch(e => console.error("SendingPC: Error setting remote description (answer):", e));
                }
                return pc;
            });
            console.log("SendingPC: WebRTC negotiation loop closed");
        })

        socket.on("lobby", () => {
            setLobby(true);
            setStrangerName("Connecting...");
        })

        socket.on("add-ice-candidate", ({candidate, type}) => {
            console.log(`Received ICE candidate from remote for ${type} PC:`, candidate);
            if (type === "sender") {
                setReceivingPc(pc => {
                    if (!pc) {
                        console.error("ReceivingPC not found when trying to add ICE candidate");
                    } else {
                        pc.addIceCandidate(candidate)
                            .then(() => console.log("ReceivingPC: Added ICE candidate successfully"))
                            .catch(e => console.error("ReceivingPC: Error adding ICE candidate:", e));
                    }
                    return pc;
                });
            } else {
                setSendingPc(pc => {
                    if (!pc) {
                        console.error("SendingPC not found when trying to add ICE candidate");
                    } else {
                        pc.addIceCandidate(candidate)
                            .then(() => console.log("SendingPC: Added ICE candidate successfully"))
                            .catch(e => console.error("SendingPC: Error adding ICE candidate:", e));
                    }
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
                localVideoRef.current.play().catch(error => console.error("Local video play failed:", error));
            } else {
                localVideoRef.current.srcObject = null;
            }
        }
    }, [localVideoRef, localVideoTrack])

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