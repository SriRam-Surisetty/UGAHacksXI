import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'expo-router';
import api from '../services/api';

// Helper to render HTML content safely (for bot messages with links)
const SafeHTML = ({ html }: { html: string }) => {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const LandingPage = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: "Hi! 👋 I'm your AI assistant. How can I help you with StockSense today?", isUser: false },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatbotOpen]);

  // Chatbot logic
  const addMessage = (text: string, isUser: boolean) => {
    setMessages(prev => [...prev, { text, isUser }]);
  };

  const getBotResponse = async (userMessage: string) => {
    try {
      // Add typing indicator
      addMessage('...', false);
      
      // Make API call to backend
      const response = await api.post('/chatbot', {
        message: userMessage
      });
      
      // Remove typing indicator
      setMessages(prev => prev.slice(0, -1));
      
      // Add actual response
      if (response.data && response.data.response) {
        addMessage(response.data.response, false);
      } else {
        addMessage('Sorry, I\'m having trouble responding right now. Please try again! 😊', false);
      }
    } catch (error) {
      console.error('Chatbot API error:', error);
      // Remove typing indicator
      setMessages(prev => prev.slice(0, -1));
      // Fallback response
      addMessage('Sorry, I\'m having trouble connecting. Please try again later! 😊', false);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    addMessage(inputValue, true);
    setInputValue('');
    getBotResponse(inputValue);
  };

  const handleQuickReply = (text: string) => {
    addMessage(text, true);
    getBotResponse(text);
  };

  return (
    <div className="font-sans text-black bg-white overflow-x-hidden relative">
        <div className="particles">
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
        </div>

        {/* Navigation */}
        <nav>
            <div className="nav-container">
                <Link href="/" className="logo">StockSense</Link>
                <ul className="nav-links">
                    <li><a href="#pricing">Pricing</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
                <div className="nav-cta-group">
                    <Link href="/login" className="nav-login">Login</Link>
                    <Link href="/signup" className="nav-cta">Get Started</Link>
                </div>
            </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
            <div className="hero-container">
                <div className="ai-badge">AI-Powered Intelligence</div>
                <h1>The Future of <span className="gradient-text">Waste Prevention</span></h1>
                <p>Harness advanced AI to predict stockouts, eliminate waste, and maximize profit. Transform your inventory into intelligent, self-optimizing systems.</p>
                <div className="hero-buttons">
                    <Link href="/signup" className="btn-primary">
                        Start Free Trial
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 0L8.59 1.41L15.17 8H0V10H15.17L8.59 16.59L10 18L20 10L10 0Z"/>
                        </svg>
                    </Link>
                    <a href="#" className="btn-secondary">Watch Demo</a>
                </div>
                <div className="dashboard-preview">
                    <div className="dashboard-wrapper">
                        <div className="dashboard-header">
                            <div className="dashboard-dot"></div>
                            <div className="dashboard-dot"></div>
                            <div className="dashboard-dot"></div>
                        </div>
                        <div className="dashboard-content">
                            <div className="dashboard-display">
                                <div className="dashboard-label">Predictive AI System</div>
                                <div className="dashboard-title">Intelligence Dashboard</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
            <div className="cta-container">
                <h2>Ready to Transform Your Business?</h2>
                <p>Join thousands of SMB owners using AI to eliminate waste, boost profits, and create sustainable operations. Start your journey today.</p>
                <Link href="/signup" className="btn-white">Get Started Free</Link>
            </div>
        </section>

        {/* Footer */}
        <footer>
            <div className="footer-container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <h3>StockSense</h3>
                        <p>AI-powered inventory management that helps SMBs eliminate food waste, maximize profits, and create positive environmental impact.</p>
                    </div>
                    <div className="footer-links">
                        <h4>Platform</h4>
                        <ul>
                            <li><a href="#">AI Forecasting</a></li>
                            <li><a href="#">Smart Reordering</a></li>
                            <li><a href="#">Waste Analytics</a></li>
                            <li><a href="#">Integrations</a></li>
                        </ul>
                    </div>
                    <div className="footer-links">
                        <h4>Company</h4>
                        <ul>
                            <li><a href="#">About Us</a></li>
                            <li><a href="#">Our Mission</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">Contact</a></li>
                        </ul>
                    </div>
                    <div className="footer-links">
                        <h4>Resources</h4>
                        <ul>
                            <li><a href="#">Help Center</a></li>
                            <li><a href="#">Case Studies</a></li>
                            <li><a href="#">Blog</a></li>
                            <li><a href="#">API Docs</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2024 StockSense. All rights reserved. | Privacy Policy | Terms of Service</p>
                </div>
            </div>
        </footer>

        {/* Chatbot Widget */}
        <div className="chatbot-widget">
            <button 
                className="chatbot-button" 
                onClick={() => setIsChatbotOpen(!isChatbotOpen)}
            >
                <svg viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 13.93 2.6 15.71 3.63 17.18L2 22L7.05 20.43C8.47 21.32 10.17 21.85 12 21.85C17.52 21.85 22 17.37 22 11.85C22 6.33 17.52 2 12 2ZM12 19.85C10.46 19.85 9 19.38 7.75 18.55L7.44 18.37L4.65 19.13L5.43 16.42L5.23 16.09C4.31 14.78 3.8 13.2 3.8 11.5C3.8 7.4 7.1 4.1 12 4.1C16.9 4.1 20.2 7.4 20.2 11.5C20.2 16.26 16.76 19.85 12 19.85Z"/>
                    <circle cx="8" cy="12" r="1.5"/>
                    <circle cx="12" cy="12" r="1.5"/>
                    <circle cx="16" cy="12" r="1.5"/>
                </svg>
            </button>

            <div className={`chatbot-window ${isChatbotOpen ? 'active' : ''}`}>
                <div className="chatbot-header">
                    <div className="chatbot-header-content">
                        <div className="chatbot-avatar">🤖</div>
                        <div className="chatbot-header-text">
                            <h3>StockSense AI</h3>
                            <p>Here to help you</p>
                        </div>
                    </div>
                    <button className="chatbot-close" onClick={() => setIsChatbotOpen(false)}>×</button>
                </div>

                <div className="chatbot-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chatbot-message ${msg.isUser ? 'user' : 'bot'}`}>
                            <div className="message-bubble">
                                <SafeHTML html={msg.text} />
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chatbot-quick-replies">
                    <button className="quick-reply-btn" onClick={() => handleQuickReply('How does the AI work?')}>How does AI work?</button>
                    <button className="quick-reply-btn" onClick={() => handleQuickReply('Pricing info')}>Pricing</button>
                    <button className="quick-reply-btn" onClick={() => handleQuickReply('Start free trial')}>Free trial</button>
                </div>

                <div className="chatbot-input-area">
                    <input 
                        type="text" 
                        className="chatbot-input" 
                        placeholder="Type your message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button className="chatbot-send" onClick={handleSend}>
                        <svg viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LandingPage;
