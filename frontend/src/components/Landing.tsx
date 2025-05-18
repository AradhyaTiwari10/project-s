import { useEffect, useRef, useState } from "react"
import { Room } from "./Room";

export const Landing = () => {
    const [name, setName] = useState("");
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [joined, setJoined] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

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

    if (!joined) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-[400px]">
                    <h1 className="text-2xl font-bold mb-4">Join Random Chat</h1>
                    <div className="mb-4">
                        <video autoPlay ref={videoRef} className="w-full h-[300px] rounded-lg object-cover"></video>
                    </div>
                    <div className="flex flex-col gap-2">
                        <input 
                            type="text" 
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="px-3 py-2 border rounded"
                        />
                        <button 
                            onClick={() => setJoined(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Join
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Room 
            name={name} 
            localAudioTrack={localAudioTrack} 
            localVideoTrack={localVideoTrack}
            onExit={() => setJoined(false)}
        />
    );
}