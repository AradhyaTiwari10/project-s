import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Video, Mic, MicOff, VideoOff, X, ArrowRight } from "lucide-react";

const URL = "http://localhost:3000/";

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
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);

    // ... [Keep all the existing WebRTC logic]

    const toggleMute = () => {
        if (localAudioTrack) {
            localAudioTrack.enabled = !localAudioTrack.enabled;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localVideoTrack) {
            localVideoTrack.enabled = !localVideoTrack.enabled;
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
            <div className="max-w-7xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                    {/* Video Section */}
                    <div className="space-y-4">
                        <div className="relative rounded-2xl overflow-hidden bg-gray-800 aspect-video">
                            <video 
                                autoPlay 
                                playsInline
                                ref={remoteVideoRef}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4 bg-black/50 px-3 py-1.5 rounded-full">
                                <p className="text-sm font-medium">{strangerName}</p>
                            </div>
                        </div>
                        
                        <div className="relative rounded-2xl overflow-hidden bg-gray-800 aspect-video">
                            <video 
                                autoPlay 
                                playsInline
                                muted
                                ref={localVideoRef}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4 bg-black/50 px-3 py-1.5 rounded-full">
                                <p className="text-sm font-medium">You ({name})</p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleMute}
                                className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'}`}
                            >
                                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleVideo}
                                className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'}`}
                            >
                                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleNext}
                                className="bg-blue-600 text-white px-6 py-4 rounded-full font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                Next <ArrowRight size={20} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleExit}
                                className="bg-red-500 text-white p-4 rounded-full hover:bg-red-600 transition-colors"
                            >
                                <X size={24} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Chat Section */}
                    <div className="bg-gray-800 rounded-2xl p-6 flex flex-col h-[calc(100vh-2rem)]">
                        <h2 className="text-xl font-semibold mb-4">Chat</h2>
                        
                        <div 
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto space-y-4 mb-4"
                        >
                            <AnimatePresence>
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-sm text-gray-400">
                                                {msg.senderName}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {msg.timestamp}
                                            </span>
                                        </div>
                                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                            msg.fromMe ? 'bg-blue-600' : 'bg-gray-700'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Type a message..."
                                className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <motion.button 
                                onClick={sendMessage}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-blue-600 p-3 rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                <Send size={20} />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};