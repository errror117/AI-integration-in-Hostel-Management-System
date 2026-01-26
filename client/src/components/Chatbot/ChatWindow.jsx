import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PaperAirplaneIcon, XMarkIcon, ChatBubbleLeftRightIcon, SparklesIcon, ChevronDownIcon } from "@heroicons/react/24/solid";

const ChatWindow = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Hide chatbot on login pages, landing site, and dashboard home pages
  const hiddenPaths = [
    '/', '/about', '/contact', '/auth', '/auth/login', '/auth/admin-login', '/auth/request', '/auth/superadmin-login',
    '/student-dashboard', '/admin-dashboard', '/superadmin'
  ];
  const shouldHide = hiddenPaths.includes(location.pathname);

  // Detect user role: super_admin, admin, or student
  const isSuperAdmin = Boolean(localStorage.getItem("superadmin"));
  const isAdmin = Boolean(localStorage.getItem("admin"));
  const userRole = isSuperAdmin ? "super_admin" : (isAdmin ? "admin" : "student");

  // Role-specific greeting messages
  const getInitialMessage = () => {
    if (isSuperAdmin) {
      return "👑 **Welcome, Super Administrator!**\n\nI'm your Platform Management Assistant.\n\n**Quick Commands:**\n* 🏢 **Organizations** - View all tenants\n* 📊 **Platform Stats** - Global analytics\n* 💳 **Subscriptions** - Billing overview\n* 🔧 **System Status** - Health check\n\n*How may I assist you?*";
    } else if (isAdmin) {
      return "🎯 **Good day, Sir/Ma'am!**\n\nI'm your Admin Assistant, ready to report.\n\n**Quick Commands:**\n* 📊 **Summary** - Hostel status report\n* 📋 **Complaints** - What students are reporting\n* 💡 **Suggestions** - What students want\n* 🚨 **Urgent** - Priority issues\n\n*How may I assist you?*";
    } else {
      return "👋 **Hi there!** I'm your AI Hostel Assistant.\n\nI can help you with:\n* 🍲 **Mess Menu & Predictions**\n* 🛏️ **Room Availability**\n* 📝 **Complaints & Tracking**\n* 📊 **Expense Analysis**\n\n*How can I assist you today?*";
    }
  };

  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: getInitialMessage(),
      timestamp: new Date().toISOString()
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Don't render chatbot on hidden paths
  if (shouldHide) return null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !minimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, minimized]);

  // Super Admin quick actions
  const superAdminActions = [
    { label: "🏢 Organizations", query: "Show all organizations" },
    { label: "📊 Platform Stats", query: "Platform stats" },
    { label: "💳 Subscriptions", query: "Show subscription overview" },
    { label: "👥 All Users", query: "How many users?" },
    { label: "🔧 System Health", query: "System status" },
    { label: "❓ Help", query: "Help me" },
  ];

  // Admin quick actions
  const adminActions = [
    { label: "📊 Summary", query: "Give me a summary" },
    { label: "📋 Complaints", query: "Show complaints" },
    { label: "💡 Suggestions", query: "Show suggestions" },
    { label: "🚨 Urgent", query: "Show urgent issues" },
    { label: "🍽️ Mess Requests", query: "Mess off requests" },
    { label: "📥 Download", query: "Download report" },
  ];

  // Student quick actions
  const studentActions = [
    { label: "🍲 Mess Menu", query: "What is the mess menu today?" },
    { label: "📋 My Complaints", query: "Show my complaints" },
    { label: "⚠️ New Complaint", query: "I want to register a complaint" },
    { label: "🍽️ Mess Off", query: "Request mess off" },
    { label: "💰 My Invoice", query: "Show my invoice" },
    { label: "❓ Help", query: "Help me" },
  ];

  // Select actions based on role
  const quickActions = isSuperAdmin ? superAdminActions : (isAdmin ? adminActions : studentActions);

  const sendMessage = async (query = input) => {
    if (!query.trim()) return;

    const userMessage = { role: "student", content: query, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(window.API_BASE_URL + "/api/chatbot/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ query, role: userRole }),
      });

      const data = await response.json();

      if (data && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: data.reply,
            intent: data.intent,
            confidence: data.confidence,
            timestamp: new Date().toISOString()
          },
        ]);
      } else {
        throw new Error(data.message || "Failed to get response");
      }
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "⚠️ **Connection Error**\n\nI'm having trouble connecting to the server. Please check your internet connection or try again later.",
          isError: true,
          timestamp: new Date().toISOString()
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Helper to format time
  const formatTime = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto group relative w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
          <ChatBubbleLeftRightIcon className="w-8 h-8 animate-bounce-slow" />

          {/* Notification Dot */}
          <span className="absolute top-3 right-3 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </button>
      )}

      {/* Main Chat Window */}
      {isOpen && (
        <div
          className={`pointer-events-auto transition-all duration-300 ease-in-out origin-bottom-right 
            ${minimized ? 'w-72 h-14' : 'w-[24rem] sm:w-[26rem] h-[600px] max-h-[85vh]'}
            bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans`}
        >
          {/* Header */}
          <div
            className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 p-4 flex justify-between items-center cursor-pointer"
            onClick={() => setMinimized(!minimized)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <SparklesIcon className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Hostel AI Agent</h3>
                <div className="flex items-center gap-1.5 opacity-90">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="text-xs text-white/90">Online & Synced</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronDownIcon className={`w-5 h-5 text-white transition-transform ${minimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="p-1.5 hover:bg-red-500/80 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"} items-end gap-2 group`}
                  >
                    {msg.role === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                        <span className="text-xs">🤖</span>
                      </div>
                    )}

                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${msg.role === "student"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-800/80 text-gray-100 border border-white/5 rounded-bl-none"
                      }`}>
                      <div className={`text-sm leading-relaxed markdown-body ${msg.isError ? 'text-red-300' : ''}`}>
                        {msg.role === 'bot' ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                              li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-bold text-blue-200" {...props} />,
                              a: ({ node, ...props }) => <a className="text-blue-300 hover:underline" target="_blank" {...props} />,
                              code: ({ node, ...props }) => <code className="bg-black/30 px-1 py-0.5 rounded text-xs font-mono text-yellow-300" {...props} />,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          msg.content
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-1.5 opacity-50 text-[10px] gap-2">
                        <span>{formatTime(msg.timestamp)}</span>
                        {msg.intent && msg.role === 'bot' && (
                          <span className="bg-black/20 px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
                            {msg.intent} • {(msg.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 opacity-50">
                      <span className="text-xs">🤖</span>
                    </div>
                    <div className="bg-slate-800/60 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5 border border-white/5">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="px-3 py-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(action.query)}
                    disabled={loading}
                    className="bg-white/5 hover:bg-white/10 active:bg-blue-500/20 border border-white/10 text-[11px] px-2.5 py-1 rounded-full text-blue-200 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-slate-800/50 backdrop-blur-md border-t border-white/5">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about mess, rooms, or complaints..."
                    disabled={loading}
                    className="w-full bg-slate-900/50 border border-white/10 text-white placeholder-slate-400 text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className="absolute right-2 p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all disabled:opacity-50 disabled:bg-slate-700 hover:scale-105 active:scale-95"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center mt-2">
                  <p className="text-[10px] text-slate-500">
                    AI responses may vary. Double-check important info.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
