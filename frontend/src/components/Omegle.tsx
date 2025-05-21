import { useEffect, useRef, useState } from "react"
import { Room } from "./Room";
import { SignedIn, SignedOut, useAuth, useUser, useClerk, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Mic, MicOff, VideoOff, Users } from "lucide-react";

export const Omegle = () => {
    const [name, setName] = useState("");
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [joined, setJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isSignedIn || !user) {
            navigate('/');
            return;
        }

        const email = user.primaryEmailAddress?.emailAddress;
        if (!email || !email.endsWith('.rishihood.edu.in')) {
            signOut();
            navigate('/');
            return;
        }
    }, [isSignedIn, user, navigate, signOut]);

    const getCam = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        setLocalAudioTrack(audioTrack);
        setlocalVideoTrack(videoTrack);
        if (videoRef.current) {
            videoRef.current.srcObject = new MediaStream([videoTrack]);
            videoRef.current.play();
        }
    }

    useEffect(() => {
        if (videoRef.current) {
            getCam();
        }
    }, [videoRef]);

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

    if (!joined) {
        return (
            <SignedIn>
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                    <div className="absolute top-4 right-4 z-50">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8"
                    >
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ready to Connect?</h1>
                                <p className="text-gray-600 mb-6">Meet new friends from your university in real-time.</p>
                                
                                <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video mb-6">
                                    <video 
                                        autoPlay 
                                        ref={videoRef} 
                                        className="w-full h-full object-cover"
                                    ></video>
                                    
                                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={toggleMute}
                                            className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-800'} text-white`}
                                        >
                                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={toggleVideo}
                                            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-800'} text-white`}
                                        >
                                            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="bg-gray-50 p-6 rounded-xl mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Users className="text-blue-500" size={24} />
                                        <h2 className="text-xl font-semibold text-gray-900">Quick Start</h2>
                                    </div>
                                    <p className="text-gray-600 mb-4">Enter your display name to start connecting with other students.</p>
                                    
                                    <input 
                                        type="text" 
                                        placeholder="Enter your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-4"
                                    />
                                    
                                    <motion.button 
                                        onClick={() => setJoined(true)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Start Chatting
                                    </motion.button>
                                </div>
                                
                                <div className="text-sm text-gray-500 text-center">
                                    By joining, you agree to our Community Guidelines
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </SignedIn>
        );
    }

    return (
        <SignedIn>
            <div className="absolute top-4 right-4 z-50">
                <UserButton afterSignOutUrl="/" />
            </div>
            <Room 
                name={name} 
                localAudioTrack={localAudioTrack} 
                localVideoTrack={localVideoTrack}
                onExit={() => setJoined(false)}
            />
        </SignedIn>
    );
}