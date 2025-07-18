import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import axios from 'axios';
import { CreditCard, Loader, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: any) => void;
  darkMode: boolean;
}

// Use localhost for backend WebSocket connection
const SOCKET_URL = 'http://localhost:3000';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, darkMode }) => {
  const [rfidInput, setRfidInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const loginRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      console.log('Socket connected');
    });
    socket.on('disconnect', () => {
      setSocketConnected(false);
      console.warn('Socket disconnected');
    });
    socket.on('connect_error', (err) => {
      setSocketConnected(false);
      console.error('Socket connection error:', err);
    });

    socket.on('rfid_auth_result', (data) => {
      setIsScanning(false);
      console.log('Received rfid_auth_result:', data);
      if (data.status === 'allow') {
        setLoginStatus('success');
        setTimeout(() => onLogin({ rfid: data.rfid_id, vehicle: data.vehicle_id }), 1000);
      } else {
        setLoginStatus('error');
        setTimeout(() => setLoginStatus('idle'), 2000);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [onLogin]);

  // UI feedback only, real scan comes from IoT device
  const simulateRFIDScan = () => {
    setIsScanning(true);
    setLoginStatus('scanning');
    // The real scan will POST to /rfid/verify and backend will emit rfid_auth_result
  };

  // Manual input for testing (optionally POST to /rfid/verify)
  const handleManualInput = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setLoginStatus('scanning');
    try {
      await axios.post(`${SOCKET_URL}/rfid/verify`, {
        vehicle_id: 'MANUAL', // Replace with real vehicle_id if needed
        rfid_id: rfidInput
      });
      // Wait for WebSocket event
    } catch (err) {
      setLoginStatus('error');
      setTimeout(() => setLoginStatus('idle'), 2000);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div ref={loginRef} className={`max-w-md w-full mx-4 p-8 rounded-2xl shadow-2xl border ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 caterpillar-yellow rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-black" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Caterpillar Access
          </h1>
          <p className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Scan your RFID card or enter credentials
          </p>
        </div>

        {!socketConnected && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-center text-sm">
            WebSocket not connected. Real-time authentication will not work.
          </div>
        )}

        <div className="space-y-6">
          {/* RFID Scanner */}
          <div ref={cardRef} className={`p-6 rounded-xl border-2 border-dashed transition-all ${
            isScanning 
              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
              : darkMode 
                ? 'border-gray-600 bg-gray-700/50' 
                : 'border-gray-300 bg-gray-50'
          }`}>
            <div className="text-center">
              <CreditCard className={`w-12 h-12 mx-auto mb-3 ${
                isScanning ? 'text-yellow-600' : darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <button
                onClick={simulateRFIDScan}
                disabled={isScanning}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  isScanning
                    ? 'bg-yellow-400 text-black cursor-not-allowed'
                    : 'caterpillar-yellow text-black hover:bg-yellow-600'
                }`}
              >
                {isScanning ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Scanning...</span>
                  </div>
                ) : (
                  'Tap to Scan RFID'
                )}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {loginStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Access Granted</span>
            </div>
          )}

          {loginStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Access Denied</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;