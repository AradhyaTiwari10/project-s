import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, SignUpButton, useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, LogIn, UserPlus, Copyright } from "lucide-react";
import { MagnetLines } from "./ui/magnet-lines";
import { Navbar1 } from "./ui/navbar-1";

const Landing = () => {
    const navigate = useNavigate();
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        if (isSignedIn && user) {
            navigate('/loading');
        }
    }, [isSignedIn, user, navigate]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            {/* Header */}
            <header className="w-full fixed top-0 left-0 right-0 z-50">
                <Navbar1 />
            </header>

            {/* Main content */}
            <main className="flex-grow pt-0 relative z-10">
                <div className="relative overflow-hidden">
                    {/* Background gradient effects */}
                    <div 
                        aria-hidden
                        className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block"
                    >
                        <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                        <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    </div>
                    
                    {/* Main content with gradient background */}
                    <div className="relative bg-gradient-to-b from-blue-50/80 to-white/90 pt-24 pb-64 px-4 min-h-[100vh] flex flex-col justify-center">
                        <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
                        
                        {/* Magnet Lines Background */}
                        <div className="absolute inset-0 -z-10 opacity-400">
                            <MagnetLines
                                rows={15}
                                columns={15}
                                containerSize="100%"
                                lineColor="#0a5adb"
                                lineWidth="0.6vmin"
                                lineHeight="4vmin"
                                baseAngle={0}
                            />
                        </div>
                        
                        {/* Content container */}
                        <div className="container mx-auto max-w-4xl text-center relative z-10 pt-32">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6">
                                    Connect with Students <span className="text-blue-600">Randomly</span>
                                </h1>
                                
                                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                                    Meet new friends from your university in a fun and spontaneous way.
                                    Chat with random students and expand your social circle!
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-blue-50 rounded-xl p-4 mb-8 border border-blue-100 max-w-2xl mx-auto"
                            >
                                <div className="flex items-center gap-2 text-blue-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm font-medium">
                                        Please use the university email address provided to you
                                    </p>
                                </div>
                            </motion.div>
                            
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col sm:flex-row justify-center gap-4 mt-8"
                            >
                                <SignedOut>
                                    <div className="bg-blue-600/10 rounded-[14px] border p-0.5">
                                        <SignInButton mode="modal">
                                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 h-auto text-lg font-medium transition-colors rounded-xl w-full sm:w-auto">
                                                <LogIn className="mr-2 h-5 w-5 inline" /> Sign In
                                            </button>
                                        </SignInButton>
                                    </div>
                                    <SignUpButton mode="modal">
                                        <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 h-auto text-lg font-medium transition-colors rounded-xl w-full sm:w-auto">
                                            <UserPlus className="mr-2 h-5 w-5 inline" /> Create Account
                                        </button>
                                    </SignUpButton>
                                </SignedOut>
                                <SignedIn>
                                    <button 
                                        onClick={() => navigate('/loading')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 h-auto text-lg font-medium transition-colors rounded-xl w-full sm:w-auto"
                                    >
                                        Start Chatting
                                    </button>
                                </SignedIn>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full bg-gray-50 py-8 border-t border-gray-100">
                <div className="container mx-auto px-4 flex justify-center items-center">
                    <div className="flex items-center text-gray-500 text-sm group hover:text-gray-700 transition-colors">
                        <Copyright size={14} className="mr-2 group-hover:text-blue-500 transition-colors" />
                        <span>{new Date().getFullYear()} Omegle University Chat. All rights reserved.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;