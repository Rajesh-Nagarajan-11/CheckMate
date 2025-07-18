import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import SafetyChecks from './components/SafetyChecks';
import Chatbot from './components/Chatbot';

function App() {
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [safetyChecksCompleted, setSafetyChecksCompleted] = useState(false);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setSafetyChecksCompleted(false); // Reset safety checks when new user logs in
  };

  const handleLogout = () => {
    setUser(null);
    setSafetyChecksCompleted(false);
  };

  const handleSafetyChecksComplete = () => {
    setSafetyChecksCompleted(true);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} darkMode={darkMode} />;
  }

  if (!safetyChecksCompleted) {
    return <SafetyChecks onComplete={handleSafetyChecksComplete} darkMode={darkMode} user={user} />;
  }

  return (
    <div className="App">
      <Dashboard user={user} onLogout={handleLogout} />
      <Chatbot darkMode={darkMode} />
    </div>
  );
}

export default App;