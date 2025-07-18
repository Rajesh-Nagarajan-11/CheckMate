import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Car, 
  Volume2, 
  Zap, 
  Droplets, 
  Gauge,
  ArrowRight,
  Clock
} from 'lucide-react';

interface SafetyChecksProps {
  onComplete: () => void;
  darkMode: boolean;
  user: any;
}

interface SafetyItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'critical' | 'important' | 'standard';
  checked: boolean;
}

const SafetyChecks: React.FC<SafetyChecksProps> = ({ onComplete, darkMode, user }) => {
  const [safetyItems, setSafetyItems] = useState<SafetyItem[]>([
    {
      id: 'brakes',
      title: 'Brake System',
      description: 'Check brake pedal feel and brake fluid level',
      icon: <Car className="w-5 h-5" />,
      category: 'critical',
      checked: false
    },
    {
      id: 'horn',
      title: 'Horn Functionality',
      description: 'Test horn operation and volume',
      icon: <Volume2 className="w-5 h-5" />,
      category: 'critical',
      checked: false
    },
    {
      id: 'electrical',
      title: 'Electrical Systems',
      description: 'Verify all lights, indicators, and electrical components',
      icon: <Zap className="w-5 h-5" />,
      category: 'critical',
      checked: false
    },
    {
      id: 'fluids',
      title: 'Fluid Levels',
      description: 'Check engine oil, coolant, and hydraulic fluid levels',
      icon: <Droplets className="w-5 h-5" />,
      category: 'important',
      checked: false
    },
    {
      id: 'gauges',
      title: 'Instrument Panel',
      description: 'Verify all gauges and warning lights are functional',
      icon: <Gauge className="w-5 h-5" />,
      category: 'important',
      checked: false
    },
    {
      id: 'seatbelt',
      title: 'Safety Harness',
      description: 'Inspect seatbelt and safety harness condition',
      icon: <Shield className="w-5 h-5" />,
      category: 'critical',
      checked: false
    },
    {
      id: 'emergency',
      title: 'Emergency Systems',
      description: 'Test emergency stop and safety shutdown systems',
      icon: <AlertTriangle className="w-5 h-5" />,
      category: 'critical',
      checked: false
    },
    {
      id: 'visibility',
      title: 'Visibility Check',
      description: 'Ensure mirrors, windows, and cameras are clean and functional',
      icon: <Shield className="w-5 h-5" />,
      category: 'standard',
      checked: false
    }
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleItem = (id: string) => {
    setSafetyItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const allChecked = safetyItems.every(item => item.checked);
  const criticalChecked = safetyItems.filter(item => item.category === 'critical').every(item => item.checked);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'important':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'standard':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getCategoryTextColor = (category: string) => {
    switch (category) {
      case 'critical':
        return 'text-red-700 dark:text-red-300';
      case 'important':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'standard':
        return 'text-blue-700 dark:text-blue-300';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  const handleComplete = () => {
    if (allChecked) {
      onComplete();
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-4xl w-full mx-4 p-8 rounded-2xl shadow-2xl border ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 caterpillar-yellow rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-black" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Pre-Operation Safety Checks
          </h1>
          <p className={`text-lg mb-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Complete all safety checks before starting operations
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className={`flex items-center space-x-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
            <div className={`flex items-center space-x-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span>Operator: {user?.rfid || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Safety Checks Progress
            </span>
            <span className={`text-sm font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {safetyItems.filter(item => item.checked).length} / {safetyItems.length}
            </span>
          </div>
          <div className={`w-full h-3 rounded-full ${
            darkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className="h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ 
                width: `${(safetyItems.filter(item => item.checked).length / safetyItems.length) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Safety Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {safetyItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                item.checked 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : getCategoryColor(item.category)
              } ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              onClick={() => toggleItem(item.id)}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  item.checked 
                    ? 'bg-green-100 dark:bg-green-800' 
                    : darkMode ? 'bg-gray-600' : 'bg-gray-100'
                }`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold ${
                      item.checked 
                        ? 'text-green-800 dark:text-green-200' 
                        : darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.title}
                    </h3>
                    <div className={`p-1 rounded-full ${
                      item.checked 
                        ? 'bg-green-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <CheckCircle className={`w-4 h-4 ${
                        item.checked ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                      }`} />
                    </div>
                  </div>
                  <p className={`text-sm ${
                    item.checked 
                      ? 'text-green-700 dark:text-green-300' 
                      : getCategoryTextColor(item.category)
                  }`}>
                    {item.description}
                  </p>
                  <div className={`mt-2 text-xs px-2 py-1 rounded-full inline-block ${
                    item.category === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    item.category === 'important' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Warning Messages */}
        {!criticalChecked && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 dark:text-red-200 font-medium">
                Critical safety checks must be completed before proceeding
              </span>
            </div>
          </div>
        )}

        {/* Complete Button */}
        <div className="text-center">
          <button
            onClick={handleComplete}
            disabled={!allChecked}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-2 mx-auto ${
              allChecked
                ? 'caterpillar-yellow text-black hover:bg-yellow-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Complete Safety Checks</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          {!allChecked && (
            <p className={`mt-3 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Please complete all safety checks to proceed
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafetyChecks; 