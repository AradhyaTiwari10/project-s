import { Navbar1 } from "./ui/navbar-1"
import { motion } from "framer-motion";
import { ArrowRight, Copyright } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="w-full fixed top-0 left-0 right-0 z-50">
        <Navbar1 />
      </header>

      {/* Main content */}
      <main className="flex-grow pt-0 px-4">
        <div className="container mx-auto max-w-4xl pt-48 pb-16">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">About Omegle Uni Edition</h1>
          
          <div className="prose prose-lg">
            <p className="text-gray-600 mb-6">
              Omegle Uni Edition is a specialized platform designed to connect university students in a safe and engaging environment. 
              Our mission is to foster meaningful connections between students while maintaining a secure and respectful space for interaction.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Our Vision</h2>
            <p className="text-gray-600 mb-6">
              We believe that university life is about more than just academics. It's about building connections, 
              sharing experiences, and growing together. Omegle Uni Edition provides a platform where students can 
              meet peers from their own university in a fun and spontaneous way.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Safety First</h2>
            <p className="text-gray-600 mb-6">
              We take student safety seriously. Our platform requires university email verification to ensure that 
              only legitimate students can access the service. We also implement strict community guidelines and 
              moderation to maintain a positive environment.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Features</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>University email verification</li>
              <li>Real-time chat with fellow students</li>
              <li>Safe and moderated environment</li>
              <li>Easy-to-use interface</li>
              <li>Mobile-responsive design</li>
            </ul>
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
  )
}

export default About