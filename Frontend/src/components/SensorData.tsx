import React, { useState, useEffect } from 'react';
import { Thermometer, Fuel, Shield, AlertTriangle } from 'lucide-react';

interface SensorDataProps {
  darkMode: boolean;
}

const SensorData: React.FC<SensorDataProps> = ({ darkMode }) => {
  const [engineTemp, setEngineTemp] = useState(85);
  const [fuelLevel, setFuelLevel] = useState(75);
  const [seatBeltStatus, setSeatBeltStatus] = useState(true);

  useEffect(() => {
    // Simulate real-time sensor data updates
    const interval = setInterval(() => {
      setEngineTemp(prev => {
        const change = (Math.random() - 0.5) * 4;
        return Math.max(70, Math.min(110, prev + change));
      });
      
      setFuelLevel(prev => {
        const change = Math.random() * 0.5;
        return Math.max(0, prev - change);
      });
      
      // Randomly toggle seatbelt status for demo
      if (Math.random() < 0.1) {
        setSeatBeltStatus(prev => !prev);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getTempColor = (temp: number) => {
    if (temp > 100) return 'text-red-500';
    if (temp > 90) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getFuelColor = (level: number) => {
    if (level < 20) return 'text-red-500';
    if (level < 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Engine Temperature */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
        darkMode ? 'bg-gray-700' : 'bg-white'
      } shadow-sm border ${
        darkMode ? 'border-gray-600' : 'border-gray-200'
      }`}>
        <Thermometer className={`w-4 h-4 ${getTempColor(engineTemp)}`} />
        <div>
          <p className={`text-xs ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Engine
          </p>
          <p className={`text-sm font-semibold ${getTempColor(engineTemp)}`}>
            {Math.round(engineTemp)}°C
          </p>
        </div>
      </div>

      {/* Fuel Level */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
        darkMode ? 'bg-gray-700' : 'bg-white'
      } shadow-sm border ${
        darkMode ? 'border-gray-600' : 'border-gray-200'
      }`}>
        <Fuel className={`w-4 h-4 ${getFuelColor(fuelLevel)}`} />
        <div>
          <p className={`text-xs ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Fuel
          </p>
          <p className={`text-sm font-semibold ${getFuelColor(fuelLevel)}`}>
            {Math.round(fuelLevel)}%
          </p>
        </div>
      </div>

      {/* Seatbelt Status */}
      {!seatBeltStatus && (
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-pulse`}>
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <div>
            <p className="text-xs text-red-600 dark:text-red-400">Seatbelt</p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Not Secured</p>
          </div>
        </div>
      )}

      {seatBeltStatus && (
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
          darkMode ? 'bg-gray-700' : 'bg-white'
        } shadow-sm border ${
          darkMode ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <Shield className="w-4 h-4 text-green-500" />
          <div>
            <p className={`text-xs ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Seatbelt
            </p>
            <p className="text-sm font-semibold text-green-500">Secured</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SensorData;