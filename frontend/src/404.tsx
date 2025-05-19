import { useNavigate } from "react-router-dom";

const Custom404 = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-[500px] text-center">
                <h1 className="text-6xl font-bold mb-6 text-gray-800">404</h1>
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Page Not Found</h2>
                <p className="text-gray-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                    Go Back Home
                </button>
            </div>
        </div>
    );
} 
export default Custom404;