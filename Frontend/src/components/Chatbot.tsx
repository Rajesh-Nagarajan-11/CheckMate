import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mic, MicOff, Volume2 } from "lucide-react";

// Type definitions for speech recognition
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

interface ChatbotProps {
  darkMode: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your CheckMate vehicle assistant. I can help you with equipment operation, maintenance, safety procedures, and troubleshooting. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [apiKey, setApiKey] = useState("AIzaSyBiONGVNvMN_oi1L_x54oFBtxJIT1ZnHsw");
  const [showApiInput, setShowApiInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Speech Recognition
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);

          // Auto-send the voice message
          setTimeout(() => {
            sendVoiceMessage(transcript);
          }, 100);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognition);
      }

      // Speech Synthesis
      if (window.speechSynthesis) {
        setSpeechSynthesis(window.speechSynthesis);
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to call AI API
  const callAIAPI = async (userMessage: string) => {
    if (!apiKey) {
      return "Please configure your API key first. Click the settings button to set it up.";
    }

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are CheckMate, a specialized AI assistant for heavy machinery and construction equipment operations. You help operators with:

1. Equipment Operation: Guidance on proper operation of Caterpillar and other heavy machinery
2. Safety Procedures: Best practices for construction site safety and equipment handling
3. Maintenance: Preventive maintenance schedules, troubleshooting, and repair guidance
4. Performance Optimization: Tips for fuel efficiency, productivity, and equipment longevity
5. Emergency Procedures: What to do in case of equipment failure or safety incidents
6. Regulatory Compliance: Understanding safety standards and operational requirements

You have access to real-time data from the vehicle monitoring system including:
- Engine temperature and performance metrics
- Fuel levels and consumption
- Task schedules and completion status
- Speed predictions and obstacle detection
- RFID access logs

Please respond in a helpful, professional manner with practical advice. If you need specific data from the monitoring system, ask the operator to check the dashboard.

User message: ${userMessage}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (error) {
      console.error("Error calling AI API:", error);
      return "I'm sorry, I'm having trouble connecting to my service right now. Please try again later.";
    }
  };

  const sendVoiceMessage = async (messageText: string) => {
    if (messageText.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: messageText,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);
      setInputText("");
      setIsLoading(true);

      // Get response from AI
      const botResponse = await callAIAPI(messageText);

      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);

      // Auto-speak the response for voice mode
      if (speechSynthesis && !isSpeaking) {
        speakText(botResponse);
      }
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: inputText,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages([...messages, newMessage]);
      const currentInput = inputText;
      setInputText("");
      setIsLoading(true);

      // Get response from AI
      const botResponse = await callAIAPI(currentInput);

      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);

      // Speak the response if speech synthesis is available
      if (speechSynthesis && !isSpeaking) {
        speakText(botResponse);
      }
    }
  };

  const startListening = () => {
    if (recognition) {
      setIsListening(true);
      setInputText(""); // Clear input when starting voice mode
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition) {
      setIsListening(false);
      recognition.stop();
    }
  };

  const speakText = (text: string) => {
    if (speechSynthesis) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleApiKeySubmit = () => {
    setShowApiInput(false);
    if (apiKey) {
      // Add a system message to confirm API key is set
      const systemMessage = {
        id: messages.length + 1,
        text: "✅ API key configured successfully! I'm now ready to assist you with your vehicle operations.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    }
  };

  if (!isOpen) {
    return (
      <div
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background:
            "linear-gradient(to bottom, #FFD700, #FFA500)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          transition: "all 0.3s ease",
          zIndex: 1000,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <MessageCircle
          style={{ width: "24px", height: "24px", color: "black" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "380px",
        height: "520px",
        backgroundColor: darkMode ? "#1f2937" : "white",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        fontFamily: '"Hanken Grotesk", sans-serif',
      }}
    >
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          @keyframes typing {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
          }
        `}
      </style>

      {/* Header */}
      <div
        style={{
          background:
            "linear-gradient(to bottom, #FFD700, #FFA500)",
          padding: "20px",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <MessageCircle
            style={{ width: "24px", height: "24px", color: "black" }}
          />
          <div>
            <h3
              style={{
                color: "black",
                margin: 0,
                fontSize: "16px",
                fontWeight: "700",
              }}
            >
              CheckMate Assistant
            </h3>
            <p
              style={{
                color: "rgba(0, 0, 0, 0.8)",
                margin: 0,
                fontSize: "12px",
              }}
            >
              {apiKey ? "Connected" : "Setup Required"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "5px",
            }}
          >
            <X style={{ width: "20px", height: "20px", color: "black" }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: message.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius: "18px",
                backgroundColor:
                  message.sender === "user" ? "#FFD700" : darkMode ? "#374151" : "#f1f5f9",
                color:
                  message.sender === "user" ? "black" : darkMode ? "white" : "hsl(224, 30%, 27%)",
                fontSize: "14px",
                lineHeight: "1.4",
                fontWeight: "500",
                whiteSpace: "pre-wrap",
              }}
            >
              {message.text}
            </div>
            <span
              style={{
                fontSize: "10px",
                color: darkMode ? "#9ca3af" : "#9ca3af",
                marginTop: "4px",
                fontWeight: "400",
              }}
            >
              {formatTime(message.timestamp)}
            </span>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "18px",
                backgroundColor: darkMode ? "#374151" : "#f1f5f9",
                color: darkMode ? "white" : "hsl(224, 30%, 27%)",
                fontSize: "14px",
                animation: "typing 1.5s infinite",
              }}
            >
              CheckMate is thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: "20px",
          borderTop: "1px solid #e2e8f0",
          borderBottomLeftRadius: "20px",
          borderBottomRightRadius: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: darkMode ? "#374151" : "#f8fafc",
            borderRadius: "25px",
            padding: "5px",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !isLoading) {
                handleSendMessage();
              }
            }}
            placeholder={
              isListening ? "Listening..." : "Ask about equipment, safety, or maintenance..."
            }
            disabled={isLoading}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              padding: "12px 16px",
              fontSize: "14px",
              fontFamily: "inherit",
              opacity: isLoading ? 0.6 : 1,
              color: darkMode ? "white" : "black",
            }}
          />

          {/* Voice Control Button */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading}
            style={{
              background: isListening
                ? "hsl(0, 100%, 67%)"
                : "#FFD700",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              animation: isListening ? "pulse 1.5s infinite" : "none",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isListening ? (
              <MicOff
                style={{ width: "18px", height: "18px", color: "white" }}
              />
            ) : (
              <Mic style={{ width: "18px", height: "18px", color: "black" }} />
            )}
          </button>

          {/* Speaker Button */}
          <button
            onClick={isSpeaking ? stopSpeaking : () => {}}
            style={{
              background: isSpeaking ? "hsl(39, 100%, 56%)" : darkMode ? "#4b5563" : "#e2e8f0",
              border: "none",
              borderRadius: "50%",
              padding: "8px",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            <Volume2
              style={{
                width: "18px",
                height: "18px",
                color: isSpeaking ? "white" : darkMode ? "#d1d5db" : "#9ca3af",
              }}
            />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            style={{
              background: isLoading
                ? "#9ca3af"
                : "linear-gradient(to bottom, #FFD700, #FFA500)",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
            }}
          >
            <Send style={{ width: "18px", height: "18px", color: "black" }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot; 