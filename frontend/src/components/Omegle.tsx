import { useEffect, useRef, useState } from "react"
import { Room } from "./Room";
import { SignedIn, SignedOut, useAuth, useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import MicVisualizer from "./MicVisualizer";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { useToast } from "./ui/use-toast";
import { Toaster } from "./ui/toaster";
import { ToastAction } from "./ui/toast";
import { LightPullThemeSwitcher } from "./ui/light-pull-theme-switcher";

export const Omegle = () => {
    const [name, setName] = useState("");
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [joined, setJoined] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");

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

        // Enumerate audio devices
        const getAudioDevices = async () => {
            try {
                // Request media permissions to get device labels
                await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
                setAudioDevices(audioInputDevices);
                if (audioInputDevices.length > 0) {
                    setSelectedAudioDevice(audioInputDevices[0].deviceId); // Select the first device by default
                }
            } catch (error) {
                console.error("Error enumerating devices:", error);
                // Handle error (e.g., display a message to the user)
            }
        };

        getAudioDevices();

    }, [isSignedIn, user, navigate, signOut]);

    const getCam = async () => {
        try {
            // Stop existing tracks before getting new ones
            if (localAudioTrack) localAudioTrack.stop();
            if (localVideoTrack) localVideoTrack.stop();

            const stream = await window.navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true // Request audio without device constraints first
            });

            // Get the audio track
            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];

            // If we have a selected audio device, try to switch to it
            if (selectedAudioDevice && audioTrack) {
                try {
                    await audioTrack.applyConstraints({
                        deviceId: { exact: selectedAudioDevice }
                    });
                } catch (error) {
                    console.warn("Could not switch to selected audio device:", error);
                }
            }

            setLocalAudioTrack(audioTrack);
            setlocalVideoTrack(videoTrack);
            if (videoRef.current) {
                videoRef.current.srcObject = new MediaStream([videoTrack]);
                videoRef.current.play();
            }
        } catch (error) {
            console.error("Error accessing camera/microphone:", error);
            toast({
                variant: "destructive",
                title: "Device Access Error",
                description: "Please ensure you have granted camera and microphone permissions.",
            });
        }
    }

    useEffect(() => {
        // Re-get camera/mic whenever the selected audio device changes
        getCam();

        // Cleanup function to stop tracks when component unmounts or dependencies change
        return () => {
            if (localAudioTrack) {
                localAudioTrack.stop();
            }
            if (localVideoTrack) {
                localVideoTrack.stop();
            }
        };

    }, [videoRef, selectedAudioDevice]); // Added selectedAudioDevice to dependencies

    const handleJoin = () => {
        if (!name.trim()) {
            toast({
                title: "Name Required",
                description: "Please enter your name before joining the chat.",
                action: <ToastAction altText="Got it">Got it</ToastAction>,
            });
            return;
        }
        setJoined(true);
    };

    if (!joined) {
        return (
            <SignedIn>
                <Toaster />
                <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 font-dm-sans">
                    <div className="absolute top-0 right-4 z-50">
                        <LightPullThemeSwitcher />
                        <div className="absolute top-17 right-0">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-signika">Pull down to change theme</p>
                        </div>
                    </div>
                    {/* Left Section: Info and Controls */}
                    <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-8">
                        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">Omegle Uni Edition</h1>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm">
                             <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Enter your details</h2>
                             <div className="mb-4">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Name
                                </label>
                                <input 
                                    id="name"
                                    type="text" 
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                             </div>

                            {/* Microphone Selection */}
                            {audioDevices.length > 0 && (
                                <div className="mb-4">
                                    <label htmlFor="audioDevice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Microphone:</label>
                                    <select
                                        id="audioDevice"
                                        value={selectedAudioDevice}
                                        onChange={(e) => setSelectedAudioDevice(e.target.value)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                                    >
                                        {audioDevices.map(device => (
                                            <option key={device.deviceId} value={device.deviceId}>
                                                {device.label || `Microphone ${device.deviceId}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            {/* Microphone Visualizer */}
                            <div className="mt-4 border dark:border-gray-600 rounded-lg overflow-hidden">
                                <MicVisualizer />
                            </div>
                        </div>
                    </div>
                    {/* Right Section: Video and Join Button */}
                    <div className="w-full md:w-2/3 flex flex-col items-center justify-center p-4">
                        <div className="w-[80%] h-[60vh] md:h-[60vh] bg-black rounded-lg overflow-hidden shadow-lg">
                             <video autoPlay ref={videoRef} className="w-full h-full object-cover scale-x-[-1]"></video>
                        </div>
                        <div className="mt-8 flex justify-center">
                            <InteractiveHoverButton 
                                text="Join Chat"
                                onClick={handleJoin}
                                className="w-48 text-lg bg-green-500 text-white border-green-600 hover:bg-green-600"
                            />
                        </div>
                    </div>
                </div>
            </SignedIn>
        );
    }

    return (
        <SignedIn>
            <Room 
                name={name} 
                localAudioTrack={localAudioTrack} 
                localVideoTrack={localVideoTrack}
                onExit={() => setJoined(false)}
            />
        </SignedIn>
    );
}