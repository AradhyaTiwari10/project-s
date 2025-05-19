import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, SignUpButton, useAuth, useSignIn, useSignUp, useUser, useClerk } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export const Landing = () => {
    const navigate = useNavigate();
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const { signIn } = useSignIn();
    const { signUp } = useSignUp();
    const { signOut } = useClerk();
    const [email, setEmail] = useState("");
    const [isValidEmail, setIsValidEmail] = useState(false);
    const [hasCheckedEmail, setHasCheckedEmail] = useState(false);

    useEffect(() => {
        if (isSignedIn && user) {
            navigate('/loading');
        }
    }, [isSignedIn, user, navigate]);

    const validateEmail = (email: string) => {
        return email.endsWith('.rishihood.edu.in');
    };

    const handleEmailCheck = () => {
        if (validateEmail(email)) {
            setIsValidEmail(true);
            setHasCheckedEmail(true);
        } else {
            setIsValidEmail(false);
            setHasCheckedEmail(true);
        }
    };

    const handleTryAgain = () => {
        setEmail("");
        setIsValidEmail(false);
        setHasCheckedEmail(false);
    };

    const handleSignIn = async () => {
        try {
            await signIn?.create({
                strategy: "email_code",
                identifier: "",
            });
            navigate('/loading');
        } catch (err) {
            console.error('Error during sign in:', err);
        }
    };

    const handleSignUp = async () => {
        try {
            await signUp?.create({
                emailAddress: "",
            });
            navigate('/loading');
        } catch (err) {
            console.error('Error during sign up:', err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-[400px] text-center">
                <h1 className="text-3xl font-bold mb-6">Welcome to Random Chat</h1>
                <p className="text-gray-600 mb-8">Connect with random people through video chat</p>
                
                {!hasCheckedEmail ? (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-500 mb-2">Please enter your university email to continue</p>
                        <input
                            type="email"
                            placeholder="Enter your university email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="px-3 py-2 border rounded"
                        />
                        <button
                            onClick={handleEmailCheck}
                            className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
                        >
                            Verify Email
                        </button>
                    </div>
                ) : !isValidEmail ? (
                    <div className="text-center">
                        <p className="text-red-500 mb-4">Sorry, you are not a university student.</p>
                        <button
                            onClick={handleTryAgain}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <SignedOut>
                        <div className="flex flex-col gap-4">
                            <SignInButton mode="modal">
                                <button 
                                    onClick={handleSignIn}
                                    className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors w-full"
                                >
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button 
                                    onClick={handleSignUp}
                                    className="bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors w-full"
                                >
                                    Sign Up
                                </button>
                            </SignUpButton>
                        </div>
                    </SignedOut>
                )}
                
                <SignedIn>
                    <button 
                        onClick={() => navigate('/loading')}
                        className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
                    >
                        Start Chatting
                    </button>
                </SignedIn>
            </div>
        </div>
    );
}