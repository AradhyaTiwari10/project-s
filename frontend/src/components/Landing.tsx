import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, SignUpButton, useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { motion } from "framer-motion";

export const Landing = () => {
    const navigate = useNavigate();
    const { isSignedIn } = useAuth();
    const { user } = useUser();

    useEffect(() => {
        if (isSignedIn && user) {
            navigate('/loading');
        }
    }, [isSignedIn, user, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-[500px] text-center border border-white/20"
            >
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Welcome to Random Chat
                    </h1>
                    <p className="text-gray-600 mb-8 text-lg">
                        Connect with random people through video chat
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-blue-50 rounded-xl p-4 mb-8 border border-blue-100"
                >
                    <div className="flex items-center gap-2 text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium">
                            Only @rishihood.edu.in email addresses are accepted
                        </p>
                    </div>
                </motion.div>
                
                <SignedOut>
                    <motion.div 
                        className="flex flex-col gap-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <SignInButton mode="modal">
                            <button 
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl w-full flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Sign In
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button 
                                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl w-full flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                </svg>
                                Sign Up
                            </button>
                        </SignUpButton>
                    </motion.div>
                </SignedOut>
                
                <SignedIn>
                    <motion.button 
                        onClick={() => navigate('/loading')}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl w-full flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        Start Chatting
                    </motion.button>
                </SignedIn>
            </motion.div>
        </div>
    );
}