import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Thermometer, Volume2, VolumeX, X } from 'lucide-react';

interface NotificationSystemProps {
  obstacleData: any;
  engineData: any;
  darkMode: boolean;
}

interface Notification {
  id: string;
  type: 'obstacle' | 'engine_heat';
  title: string;
  message: string;
  severity: 'warning' | 'critical';
  timestamp: Date;
  read: boolean;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  obstacleData, 
  engineData, 
  darkMode 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.current = window.speechSynthesis;
    }
  }, []);

  // Create audio element for notification sounds
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
  }, []);

  // Check for obstacle detection
  useEffect(() => {
    if (obstacleData && obstacleData.obstacle_detected) {
      const notification: Notification = {
        id: `obstacle-${Date.now()}`,
        type: 'obstacle',
        title: '⚠️ Obstacle Detected',
        message: `Obstacle detected at ${obstacleData.distance_cm?.toFixed(1) || 'unknown'} cm distance. Please proceed with caution.`,
        severity: 'warning',
        timestamp: new Date(),
        read: false
      };
      
      addNotification(notification);
      playVoiceAlert('Obstacle detected. Please proceed with caution.');
    }
  }, [obstacleData?.obstacle_detected]);

  // Check for engine heat abnormalities
  useEffect(() => {
    if (engineData) {
      const temp = engineData.engine_temperature;
      const hasFault = engineData.fault_status && 
        (engineData.fault_status.toLowerCase().includes('temperature') || 
         engineData.fault_status.toLowerCase().includes('overheat'));

      if (temp > 90 || hasFault) {
        const notification: Notification = {
          id: `engine-${Date.now()}`,
          type: 'engine_heat',
          title: '🔥 Engine Temperature Warning',
          message: `Engine temperature is ${temp?.toFixed(1) || 'unknown'}°C. ${hasFault ? engineData.fault_status : 'Temperature is above normal range.'}`,
          severity: temp > 100 || hasFault ? 'critical' : 'warning',
          timestamp: new Date(),
          read: false
        };
        
        addNotification(notification);
        playVoiceAlert(`Engine temperature warning. Temperature is ${temp?.toFixed(1) || 'unknown'} degrees Celsius.`);
      }
    }
  }, [engineData?.engine_temperature, engineData?.fault_status]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => {
      // Check if similar notification already exists (within last 30 seconds)
      const existingIndex = prev.findIndex(n => 
        n.type === notification.type && 
        Date.now() - n.timestamp.getTime() < 30000
      );
      
      if (existingIndex >= 0) {
        // Update existing notification
        const updated = [...prev];
        updated[existingIndex] = { ...notification, id: updated[existingIndex].id };
        return updated;
      } else {
        // Add new notification
        return [notification, ...prev.slice(0, 4)]; // Keep only last 5 notifications
      }
    });
  };

  const playVoiceAlert = (message: string) => {
    if (isMuted) return;

    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }

    // Speak the alert
    if (speechSynthesis.current) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      utterance.volume = 0.8;
      utterance.lang = 'en-US';
      
      // Cancel any existing speech
      speechSynthesis.current.cancel();
      speechSynthesis.current.speak(utterance);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
    }
  };

  // Auto-dismiss critical notifications after 30 seconds
  useEffect(() => {
    const criticalNotifications = notifications.filter(n => n.severity === 'critical' && !n.read);
    
    criticalNotifications.forEach(notification => {
      const timer = setTimeout(() => {
        markAsRead(notification.id);
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    });
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <style>
        {`
          @keyframes slideDown {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-slideDown {
            animation: slideDown 0.5s ease-out;
          }
        `}
      </style>

      {/* Notification Bell */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-3 rounded-full shadow-lg transition-all duration-300 ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          } hover:shadow-xl`}
        >
          <AlertTriangle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`absolute top-12 right-0 p-2 rounded-full shadow-lg transition-all duration-300 ${
            isMuted 
              ? 'bg-red-500 text-white' 
              : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
          } hover:shadow-xl`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed top-20 right-4 z-50 w-80 max-h-96 overflow-y-auto">
          <div className={`rounded-xl shadow-2xl border ${
            darkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-4 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex justify-between items-center">
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Notifications ({unreadCount} unread)
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-2">
              {notifications.length === 0 ? (
                <div className={`text-center py-8 text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`mb-2 p-3 rounded-lg border-l-4 transition-all duration-300 ${
                      notification.severity === 'critical'
                        ? 'border-red-500 bg-red-50 dark:bg-red-800/80'
                        : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-800/80'
                    } ${notification.read ? 'opacity-60' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {notification.type === 'obstacle' ? (
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <Thermometer className="w-4 h-4 text-red-600" />
                          )}
                          <h4 className={`font-semibold text-sm ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                        </div>
                        <p className={`text-xs ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>
                        <p className={`text-xs mt-1 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ml-2"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications for Critical Alerts */}
      {notifications.filter(n => n.severity === 'critical' && !n.read).map((notification) => (
        <div
          key={`toast-${notification.id}`}
          className={`fixed top-4 left-4 z-50 p-4 rounded-lg shadow-2xl border-l-4 border-red-500 bg-red-50 dark:bg-red-800/90 max-w-sm animate-pulse ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-sm">Critical Alert</span>
          </div>
          <p className="text-sm">{notification.message}</p>
        </div>
      ))}

      {/* Overlay Notifications for Critical Alerts */}
      {notifications.filter(n => n.severity === 'critical' && !n.read).map((notification) => (
        <div
          key={`overlay-${notification.id}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        >
          <div className={`mx-4 p-6 rounded-2xl shadow-2xl border-4 border-red-500 max-w-md w-full ${
            darkMode ? 'bg-red-900/95' : 'bg-white'
          } animate-bounce`}>
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                {notification.type === 'obstacle' ? (
                  <AlertTriangle className="w-8 h-8 text-white" />
                ) : (
                  <Thermometer className="w-8 h-8 text-white" />
                )}
              </div>

              {/* Title */}
              <h2 className={`text-2xl font-bold mb-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {notification.title}
              </h2>

              {/* Message */}
              <p className={`text-lg mb-6 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {notification.message}
              </p>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => {
                    markAsRead(notification.id);
                    removeNotification(notification.id);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                >
                  Dismiss
                </button>
              </div>

              {/* Auto-dismiss timer */}
              <div className="mt-4">
                <div className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Auto-dismiss in 30 seconds
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Banner Notifications for Warnings */}
      {notifications.filter(n => n.severity === 'warning' && !n.read).map((notification) => (
        <div
          key={`banner-${notification.id}`}
          className={`fixed top-0 left-0 right-0 z-[90] p-4 shadow-lg border-b-2 border-yellow-500 ${
            darkMode ? 'bg-yellow-600/90' : 'bg-yellow-50'
          } animate-slideDown`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {notification.title}
                </h3>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {notification.message}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => markAsRead(notification.id)}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
              >
                Acknowledge
              </button>
              <button
                onClick={() => removeNotification(notification.id)}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default NotificationSystem; 