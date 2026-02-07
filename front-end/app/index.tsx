import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'expo-router';

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

  const getBotResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    let response = '';

    if (lowerMessage.includes('ai') || lowerMessage.includes('work')) {
      response = 'Our AI uses advanced machine learning algorithms to analyze your inventory patterns and predict stockouts with 95% accuracy. It continuously learns from your data to provide smarter recommendations! 🧠';
    } else if (lowerMessage.includes('pricing') || lowerMessage.includes('cost')) {
      response = 'We offer flexible pricing plans starting from $49/month. All plans include AI forecasting, real-time tracking, and 24/7 support. Want to see our full pricing? <a href="#pricing" style="color: #341755; text-decoration: underline;">Check it out</a> 💰';
    } else if (lowerMessage.includes('trial') || lowerMessage.includes('free')) {
      response = 'Great! You can start your free 14-day trial right now - no credit card required. <a href="/signup" style="color: #341755; text-decoration: underline;">Sign up here</a> to get started! 🚀';
    } else if (lowerMessage.includes('waste')) {
      response = 'Our platform helps reduce waste by 40% on average through predictive analytics and smart reordering. You\'ll save money and help the environment! 🌱';
    } else if (lowerMessage.includes('demo')) {
      response = 'I\'d love to show you a demo! You can <a href="#" style="color: #341755; text-decoration: underline;">book a personalized demo</a> with our team or watch a quick video tour. 🎥';
    } else {
      response = 'That\'s a great question! I recommend chatting with our team for more details. You can <a href="/signup" style="color: #341755; text-decoration: underline;">start your free trial</a> or <a href="#contact" style="color: #341755; text-decoration: underline;">contact us</a> directly. 😊';
    }

    setTimeout(() => {
      addMessage(response, false);
    }, 500);
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

        {/* Stats Section */}
        <section className="stats-section">
            <div className="stats-container">
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>40%</h3>
                        <p>Waste Reduction</p>
                    </div>
                    <div className="stat-card">
                        <h3>$15K</h3>
                        <p>Monthly Savings</p>
                    </div>
                    <div className="stat-card">
                        <h3>95%</h3>
                        <p>AI Accuracy</p>
                    </div>
                    <div className="stat-card">
                        <h3>2.5K+</h3>
                        <p>Active Users</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section className="features">
            <div className="features-container">
                <div className="section-header">
                    <h2>Advanced <span className="gradient-text">AI Intelligence</span></h2>
                    <p>Neural networks and machine learning algorithms that continuously optimize your inventory in real-time.</p>
                </div>

                <div className="feature-showcase">
                    <div className="feature-content">
                        <h3>Predictive Forecasting</h3>
                        <p>Advanced AI algorithms analyze millions of data points to predict stockouts with 95% accuracy. Make informed decisions before problems arise.</p>
                        <Link href="/signup" className="btn-primary">Explore AI</Link>
                    </div>
                    <div className="feature-visual">
                        <div className="feature-visual-content">
                            <div className="feature-icon">🧠</div>
                            <div className="feature-visual-label">Neural Network Analysis</div>
                        </div>
                    </div>
                </div>

                <div className="feature-showcase">
                    <div className="feature-visual">
                        <div className="feature-visual-content">
                            <div className="feature-icon">⚡</div>
                            <div className="feature-visual-label">Real-Time Synchronization</div>
                        </div>
                    </div>
                    <div className="feature-content">
                        <h3>Live Inventory Intelligence</h3>
                        <p>Watch your inventory levels update instantly across all touchpoints. Real-time data synchronization ensures you're always informed.</p>
                        <Link href="/signup" className="btn-primary">Start Tracking</Link>
                    </div>
                </div>

                <div className="feature-showcase">
                    <div className="feature-content">
                        <h3>Smart Waste Detection</h3>
                        <p>Machine learning identifies waste patterns and provides actionable recommendations. Turn insights into profit-driving decisions.</p>
                        <Link href="/signup" className="btn-primary">View Analytics</Link>
                    </div>
                    <div className="feature-visual">
                        <div className="feature-visual-content">
                            <div className="feature-icon">📊</div>
                            <div className="feature-visual-label">Pattern Recognition</div>
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
            {!isChatbotOpen && <div className="chatbot-pulse"></div>}
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
