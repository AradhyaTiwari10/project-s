import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export const Loading = () => {
    const navigate = useNavigate();
    const { user } = useUser();

    useEffect(() => {
        const checkEmail = async () => {
            if (user) {
                const email = user.primaryEmailAddress?.emailAddress;
                if (email && email.endsWith('.rishihood.edu.in')) {
                    navigate('/omegle');
                } else {
                    navigate('/caught');
                }
            }
        };

        checkEmail();
    }, [user, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-[400px] text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                    <h2 className="text-xl font-semibold text-gray-700">Verifying your email...</h2>
                    <p className="text-gray-500">Please wait while we verify your university email address.</p>
                </div>
            </div>
        </div>
    );
} 