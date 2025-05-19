"use client" 

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import { SignInButton, SignUpButton } from "@clerk/clerk-react"
import { useNavigate } from "react-router-dom"

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <div className="flex justify-center w-full py-6 px-4">
      <div className="flex items-center justify-between px-6 py-3 bg-white rounded-full shadow-lg w-full max-w-7xl relative z-10">
        <div className="flex items-center">
          <motion.div
            className="flex items-center cursor-pointer"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 mr-3">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="url(#paint0_linear)" />
                <defs>
                  <linearGradient id="paint0_linear" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF9966" />
                    <stop offset="1" stopColor="#FF5E62" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-blue-600">Omegle</h1>
            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              Uni Edition
            </span>
          </motion.div>
        </div>
        
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {[
              { name: "Home", path: "/" },
              { name: "About", path: "/about" },
              { name: "How it works", path: "/how-it-works" }
            ].map((item) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
              >
                <a 
                  href={item.path} 
                  className="text-sm text-gray-900 hover:text-gray-600 transition-colors font-medium"
                >
                  {item.name}
                </a>
              </motion.div>
            ))}
          </nav>

        {/* Desktop CTA Buttons */}
        <motion.div
          className="hidden md:flex items-center space-x-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <SignInButton mode="modal">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center justify-center px-5 py-2 text-sm text-gray-900 border border-gray-900 rounded-full hover:bg-gray-50 transition-colors"
            >
              Sign In
            </motion.button>
          </SignInButton>
          <SignUpButton mode="modal">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center justify-center px-5 py-2 text-sm text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
            >
              Create Account
            </motion.button>
          </SignUpButton>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button className="md:hidden flex items-center" onClick={toggleMenu} whileTap={{ scale: 0.9 }}>
          <Menu className="h-6 w-6 text-gray-900" />
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-white z-50 pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-gray-900" />
            </motion.button>
            <div className="flex flex-col space-y-6">
              {[
                { name: "Home", path: "/" },
                { name: "About", path: "/about" },
                { name: "How it works", path: "/how-it-works" }
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <a 
                    href={item.path} 
                    className="text-base text-gray-900 font-medium" 
                    onClick={toggleMenu}
                  >
                    {item.name}
                  </a>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-6 space-y-4"
              >
                <SignInButton mode="modal">
                  <button
                    className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-gray-900 border border-gray-900 rounded-full hover:bg-gray-50 transition-colors"
                    onClick={toggleMenu}
                  >
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
                    onClick={toggleMenu}
                  >
                    Create Account
                  </button>
                </SignUpButton>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { Navbar1 } 