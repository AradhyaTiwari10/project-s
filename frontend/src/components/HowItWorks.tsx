import { Navbar1 } from "./ui/navbar-1";
import { motion } from "framer-motion";
import { Copyright } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      title: "Sign Up",
      description: "Create an account using your university email address. This ensures that only verified students can access the platform.",
      icon: "🎓"
    },
    {
      title: "Start Chatting",
      description: "Click the 'Start Chatting' button to be randomly matched with another student from your university.",
      icon: "💬"
    },
    {
      title: "Connect",
      description: "Engage in real-time conversations with your matched peer. Share experiences, discuss interests, or just chat casually.",
      icon: "🤝"
    },
    {
      title: "Stay Safe",
      description: "Our platform includes built-in safety features and moderation to ensure a positive experience for everyone.",
      icon: "🛡️"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <header className="w-full fixed top-0 left-0 right-0 z-50">
        <Navbar1 />
      </header>

      <main className="flex-grow pt-0 px-4">
        <div className="container mx-auto max-w-4xl pt-48 pb-16">
          <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
            How It <span className="text-blue-600">Works</span>
          </h1>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
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

export default HowItWorks; 