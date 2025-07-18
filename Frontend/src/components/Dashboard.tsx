import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Settings, 
  Car, 
  CheckCircle, 
  Clock, 
  Wrench, 
  MapPin, 
  AlertTriangle,
  BookOpen,
  Award,
  PlayCircle,
  FileText,
  Brain,
  Trophy,
  User,
  Sun,
  Moon,
  LogOut,
  Gauge,
  Activity,
  ClipboardList,
  Shield,
  X
} from 'lucide-react';

import LogsMenu from './LogsMenu';
import IncidentLogger from './IncidentLogger';
import NotificationSystem from './NotificationSystem';
import axios from 'axios';

gsap.registerPlugin(ScrollTrigger);

interface Task {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  duration: string;
  type: 'video' | 'document' | 'quiz';
  content?: {
    text: string;
    youtubeUrl?: string;
    sections?: Array<{
      title: string;
      content: string;
    }>;
  };
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'logs' | 'incidents' | 'learning'>('tasks');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedLearningModule, setSelectedLearningModule] = useState<LearningModule | null>(null);
  const [seatBeltOn, setSeatBeltOn] = useState(false);
  const seatbeltVoiceRef = useRef<HTMLAudioElement | null>(null);
  
  const dashboardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  // Real-time data states
  const [taskData, setTaskData] = useState<any[]>([]);
  const [speedData, setSpeedData] = useState<any>(null);
  const [obstacleData, setObstacleData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [engineData, setEngineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);

  // Fetch all data separately from individual endpoints
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const vehicleId = user.vehicle_id || '004B12EFE56C'; // Use from user or default
      
      // Fetch task data
      try {
        const taskRes = await axios.get('http://localhost:3000/latest/task', {
          params: { vehicle_id: vehicleId }
        });
        // The backend returns the latest single task, but we need to get all tasks
        // Let's use the dashboard endpoint to get the full task_data array
        const dashboardRes = await axios.get('http://localhost:3000/latest/dashboard', {
          params: { vehicle_id: vehicleId }
        });
        setTaskData(dashboardRes.data.task_data || []);
      } catch (err) {
        console.log('No task data found');
        setTaskData([]);
      }

      // Fetch speed data
      try {
        const speedRes = await axios.get('http://localhost:3000/latest/speed', {
          params: { vehicle_id: vehicleId }
        });
        setSpeedData(speedRes.data.speed_data);
      } catch (err) {
        console.log('No speed data found');
        setSpeedData(null);
      }

      // Fetch engine data
      try {
        const engineRes = await axios.get('http://localhost:3000/latest/engine', {
          params: { vehicle_id: vehicleId }
        });
        setEngineData(engineRes.data.engine_data);
      } catch (err) {
        console.log('No engine data found');
        setEngineData(null);
      }

      // Fetch obstacle data
      try {
        const obstacleRes = await axios.get('http://localhost:3000/latest/obstacle', {
          params: { vehicle_id: vehicleId }
        });
        setObstacleData(obstacleRes.data.obstacle_data);
      } catch (err) {
        console.log('No obstacle data found');
        setObstacleData(null);
      }

      // Fetch logs
      try {
        const logsRes = await axios.get('http://localhost:3000/latest/logs', {
          params: { vehicle_id: vehicleId }
        });
        setLogs(logsRes.data.logs || []);
      } catch (err) {
        console.log('No logs found');
        setLogs([]);
      }

    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch task history from API (for the refresh button)
  const fetchTaskHistory = async () => {
    try {
      setTaskLoading(true);
      const vehicleId = user.vehicle_id || '004B12EFE56C';
      // Use dashboard endpoint to get the full task_data array
      const res = await axios.get('http://localhost:3000/latest/dashboard', {
        params: { vehicle_id: vehicleId }
      });
      setTaskData(res.data.task_data || []);
    } catch (err) {
      console.error('Failed to fetch task history:', err);
      setTaskData([]);
    } finally {
      setTaskLoading(false);
    }
  };



  useEffect(() => {
    fetchAllData();
    const socket: Socket = io('http://localhost:3000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 100, // Ultra-fast reconnection
      reconnectionDelayMax: 500, // Max 500ms delay
      timeout: 1000, // Very fast timeout
      forceNew: true,
      upgrade: false, // Force WebSocket only
      rememberUpgrade: false,
      autoConnect: true,
      query: { vehicle_id: user.vehicle_id || '004B12EFE56C' }
    });
    
    socket.on('connect', () => {
      console.log('🚀 WebSocket connected - Ultra-fast real-time updates active');
    });
    
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
    
    // Ultra-fast state updates with requestAnimationFrame
    socket.on('task_update', (data) => {
      requestAnimationFrame(() => {
        setTaskData(data.task_data);
        setLogs(data.logs);
      });
      console.log('⚡⚡⚡ Instant task update:', data);
    });
    
    socket.on('speed_update', (data) => {
      requestAnimationFrame(() => {
        setSpeedData(data.speed_data);
        setLogs(data.logs);
      });
      console.log('⚡⚡⚡ Instant speed update:', data);
    });
    
    socket.on('obstacle_update', (data) => {
      requestAnimationFrame(() => {
        setObstacleData(data.obstacle_data);
        setLogs(data.logs);
      });
      console.log('⚡⚡⚡ Instant obstacle update:', data);
    });
    
    socket.on('operatorlog_update', (data) => {
      requestAnimationFrame(() => {
        if (data.event === 'engine_data' && data.log?.engine_data) {
          setEngineData(data.log.engine_data);
          console.log('⚡⚡⚡ Instant engine update:', data);
        }
        if (data.log?.logs) {
          setLogs(data.log.logs);
        }
      });
    });
    
    return () => {
      socket.disconnect();
    };
  }, [user.vehicle_id]);

  // Voice alert for seatbelt
  useEffect(() => {
    if (!seatBeltOn) {
      // Play voice alert
      if (window.speechSynthesis) {
        const utterance = new window.SpeechSynthesisUtterance('Please wear your seat belt.');
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = 'en-US';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [seatBeltOn]);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Excavate Site A',
      description: 'Complete excavation work at construction site A with proper safety protocols',
      icon: <MapPin className="w-5 h-5" />,
      completed: false,
      priority: 'high',
      estimatedTime: '4 hours'
    },
    {
      id: '2',
      title: 'Complete Machine Checks',
      description: 'Perform routine maintenance checks on hydraulic systems and engine',
      icon: <Wrench className="w-5 h-5" />,
      completed: true,
      priority: 'high',
      estimatedTime: '1 hour'
    },
    {
      id: '3',
      title: 'Safety Inspection',
      description: 'Conduct daily safety inspection of equipment and work area',
      icon: <AlertTriangle className="w-5 h-5" />,
      completed: false,
      priority: 'medium',
      estimatedTime: '30 minutes'
    },
    {
      id: '4',
      title: 'Update Progress Report',
      description: 'Submit daily progress report to site supervisor',
      icon: <FileText className="w-5 h-5" />,
      completed: false,
      priority: 'low',
      estimatedTime: '15 minutes'
    }
  ]);

  const learningModules: LearningModule[] = [
    {
      id: '1',
      title: 'Hydraulic Systems Basics',
      description: 'Learn the fundamentals of hydraulic systems in heavy machinery',
      icon: <PlayCircle className="w-6 h-6" />,
      progress: 75,
      duration: '2h 30m',
      type: 'video',
      content: {
        text: 'Hydraulic systems are the backbone of heavy machinery operations. Understanding how hydraulic fluid, pumps, valves, and actuators work together is crucial for safe and efficient operation.',
        youtubeUrl: 'https://www.youtube.com/watch?v=YlmRa-9zDF8',
        sections: [
          {
            title: 'Hydraulic Fluid Properties',
            content: 'Hydraulic fluid must maintain proper viscosity, resist oxidation, and provide adequate lubrication. Regular fluid analysis helps prevent system failures and extends component life.'
          },
          {
            title: 'Pump Operation',
            content: 'Hydraulic pumps convert mechanical energy into hydraulic energy. Understanding pump types (gear, vane, piston) and their operating characteristics is essential for troubleshooting.'
          },
          {
            title: 'Valve Functions',
            content: 'Control valves regulate flow direction, pressure, and flow rate. Directional valves, pressure relief valves, and flow control valves work together to control machine movement.'
          },
          {
            title: 'Safety Considerations',
            content: 'Always depressurize hydraulic systems before maintenance. Use proper PPE when working with hydraulic systems, as high-pressure fluid can cause serious injury.'
          }
        ]
      }
    },
    {
      id: '2',
      title: 'Safety Protocols',
      description: 'Essential safety procedures for construction sites',
      icon: <AlertTriangle className="w-6 h-6" />,
      progress: 100,
      duration: '1h 45m',
      type: 'document',
      content: {
        text: 'Safety is paramount in construction operations. Following established protocols prevents accidents, protects workers, and ensures compliance with regulations.',
        youtubeUrl: 'https://www.youtube.com/watch?v=wz-PtEJBGSY',
        sections: [
          {
            title: 'Pre-Operation Safety Checks',
            content: 'Conduct thorough inspections before starting any equipment. Check fluid levels, tire pressure, brake systems, and safety devices. Never operate equipment with known defects.'
          },
          {
            title: 'Personal Protective Equipment (PPE)',
            content: 'Always wear appropriate PPE including hard hats, safety glasses, high-visibility vests, steel-toed boots, and hearing protection when required.'
          },
          {
            title: 'Communication Protocols',
            content: 'Establish clear communication with ground personnel and other operators. Use hand signals, radios, or other approved communication methods. Never assume others can see you.'
          },
          {
            title: 'Emergency Procedures',
            content: 'Know emergency shutdown procedures for all equipment. Understand evacuation routes and emergency contact numbers. Regular emergency drills ensure preparedness.'
          }
        ]
      }
    },
    {
      id: '3',
      title: 'Engine Maintenance',
      description: 'Comprehensive guide to engine maintenance and troubleshooting',
      icon: <Wrench className="w-6 h-6" />,
      progress: 45,
      duration: '3h 15m',
      type: 'video',
      content: {
        text: 'Proper engine maintenance ensures reliable operation, extends engine life, and prevents costly repairs. Regular maintenance schedules and proper procedures are essential.',
        youtubeUrl: 'https://www.youtube.com/watch?v=9R8niJc53ts',
        sections: [
          {
            title: 'Daily Maintenance',
            content: 'Check oil levels, coolant levels, and fuel levels daily. Inspect for leaks, unusual noises, and warning lights. Clean air filters and check tire pressure.'
          },
          {
            title: 'Scheduled Maintenance',
            content: 'Follow manufacturer-recommended maintenance schedules. Change oil and filters at specified intervals. Inspect belts, hoses, and electrical connections regularly.'
          },
          {
            title: 'Troubleshooting Common Issues',
            content: 'Learn to identify common engine problems: overheating, low power, unusual noises, and starting difficulties. Keep detailed maintenance logs for reference.'
          },
          {
            title: 'Winter Operations',
            content: 'Use proper winter fuel and coolant. Allow adequate warm-up time in cold weather. Check battery condition and charging system before winter operations.'
          }
        ]
      }
    },
    {
      id: '4',
      title: 'Equipment Quiz',
      description: 'Test your knowledge of heavy machinery operations',
      icon: <Brain className="w-6 h-6" />,
      progress: 0,
      duration: '30m',
      type: 'quiz',
      content: {
        text: 'Regular knowledge assessments help ensure operators maintain proficiency and stay updated on best practices. This quiz covers essential topics for safe and efficient operation.',
        sections: [
          {
            title: 'Quiz Format',
            content: 'The quiz consists of multiple-choice questions covering safety, maintenance, operation, and troubleshooting topics. Passing score is 80% or higher.'
          },
          {
            title: 'Topics Covered',
            content: 'Engine operation, hydraulic systems, safety protocols, maintenance procedures, emergency response, and regulatory compliance.'
          },
          {
            title: 'Certification',
            content: 'Successful completion provides certification valid for one year. Regular retesting ensures continued competency and safety awareness.'
          }
        ]
      }
    }
  ];

  const quizQuestions: QuizQuestion[] = [
    {
      id: '1',
      question: 'What is the maximum operating temperature for a Caterpillar engine?',
      options: ['85°C', '95°C', '105°C', '115°C'],
      correctAnswer: 2
    },
    {
      id: '2',
      question: 'How often should you check hydraulic fluid levels in a Caterpillar excavator?',
      options: ['Once a week', 'Daily', 'Every 8 hours', 'Monthly'],
      correctAnswer: 2
    },
    {
      id: '3',
      question: 'What should you do before starting any maintenance work on a Caterpillar machine?',
      options: ['Check the weather', 'Turn off the engine and engage safety locks', 'Call your supervisor', 'Clean the machine'],
      correctAnswer: 1
    },
    {
      id: '4',
      question: 'What is the recommended idle time for a Caterpillar engine to warm up?',
      options: ['1-2 minutes', '3-5 minutes', '5-10 minutes', '15 minutes'],
      correctAnswer: 1
    },
    {
      id: '5',
      question: 'Which component is most critical for safe operation of a Caterpillar excavator?',
      options: ['Radio system', 'Air conditioning', 'Undercarriage and tracks', 'Paint color'],
      correctAnswer: 2
    },
    {
      id: '6',
      question: 'What is the primary purpose of the hydraulic system in a Caterpillar machine?',
      options: ['To provide heat', 'To generate electricity', 'To power attachments and movement', 'To play music'],
      correctAnswer: 2
    },
    {
      id: '7',
      question: 'How should you approach a slope when operating a Caterpillar excavator?',
      options: ['As fast as possible', 'Sideways', 'Straight up and down', 'At a safe angle with proper technique'],
      correctAnswer: 3
    },
    {
      id: '8',
      question: 'What does the yellow warning light on a Caterpillar dashboard typically indicate?',
      options: ['Engine overheating', 'Low fuel', 'Maintenance required', 'All of the above'],
      correctAnswer: 3
    }
  ];

  useEffect(() => {
    // Initial animation
    gsap.fromTo(dashboardRef.current, 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    );

    // Animate cards on scroll
    cardsRef.current.forEach((card, index) => {
      if (card) {
        gsap.fromTo(card, 
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: index * 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    });
  }, []);

  useEffect(() => {
    // Animate tab switch
    const tl = gsap.timeline();
    
    tl.fromTo(contentRef.current, 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
  }, [activeTab]);

  const setActiveTabWithAnimation = (tab: 'tasks' | 'logs' | 'incidents' | 'learning') => {
    if (tab !== activeTab) {
      gsap.to(contentRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setActiveTab(tab);
        }
      });
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const startQuiz = () => {
    setQuizActive(true);
    setCurrentQuestion(0);
    setQuizScore(0);
    setQuizCompleted(false);
    setSelectedAnswer(null);
  };

  const selectAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const nextQuestion = () => {
    if (selectedAnswer === quizQuestions[currentQuestion].correctAnswer) {
      setQuizScore(quizScore + 1);
    }
    
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setQuizCompleted(true);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return darkMode ? 'border-red-400 bg-red-900/20' : 'border-red-500 bg-red-50';
      case 'medium': return darkMode ? 'border-yellow-400 bg-yellow-900/20' : 'border-yellow-500 bg-yellow-50';
      case 'low': return darkMode ? 'border-green-400 bg-green-900/20' : 'border-green-500 bg-green-50';
      default: return darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div ref={dashboardRef} className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Notification System */}
      <NotificationSystem 
        obstacleData={obstacleData}
        engineData={engineData}
        darkMode={darkMode}
      />
      
      {/* Header */}
      <header className={`shadow-lg border-b transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 caterpillar-yellow rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-7 h-7 text-black" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  CheckMate
                </h1>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Welcome back, {user.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Tabs */}
              <div className={`flex rounded-xl p-1 shadow-inner ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <button
                  onClick={() => setActiveTabWithAnimation('tasks')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    activeTab === 'tasks' 
                      ? 'caterpillar-yellow text-black shadow-md transform scale-105' 
                      : darkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-600' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Tasks</span>
                </button>
                <button
                  onClick={() => setActiveTabWithAnimation('logs')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    activeTab === 'logs' 
                      ? 'caterpillar-yellow text-black shadow-md transform scale-105' 
                      : darkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-600' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span className="font-medium">Logs</span>
                </button>
                <button
                  onClick={() => setActiveTabWithAnimation('incidents')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    activeTab === 'incidents' 
                      ? 'caterpillar-yellow text-black shadow-md transform scale-105' 
                      : darkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-600' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Incidents</span>
                </button>
                <button
                  onClick={() => setActiveTabWithAnimation('learning')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    activeTab === 'learning' 
                      ? 'caterpillar-yellow text-black shadow-md transform scale-105' 
                      : darkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-600' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Learning</span>
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                disabled={!seatBeltOn}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Seat Belt Toggle (always enabled) */}
              <div className="relative z-50">
                <button
                  onClick={() => setSeatBeltOn((prev) => !prev)}
                  className={`p-2 rounded-lg transition-colors border-2 ${
                    seatBeltOn
                      ? 'border-green-500 bg-green-100 text-green-700' 
                      : 'border-red-500 bg-red-100 text-red-700 animate-pulse'
                  }`}
                  title={seatBeltOn ? 'Seat Belt Secured' : 'Seat Belt Not Secured'}
                  style={{ position: 'relative', zIndex: 1001 }}
                >
                  <Shield className={`w-5 h-5 ${seatBeltOn ? 'text-green-500' : 'text-red-500'}`} />
                </button>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={onLogout}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Seat Belt Banner Notification */}
      {!seatBeltOn && (
        <div className="w-full bg-red-600 text-white text-center py-3 font-semibold text-lg animate-pulse z-40">
          <AlertTriangle className="inline w-6 h-6 mr-2 align-middle" />
          Please wear your seat belt for your safety!
        </div>
      )}

      {/* Seat Belt Overlay - blocks all except shield toggle */}
      {!seatBeltOn && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black bg-opacity-70 select-none" style={{ pointerEvents: 'auto' }}>
          <div className="mb-8 text-center">
            <Shield className="w-16 h-16 mx-auto text-red-500 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mt-4 mb-2">Seat Belt Required</h2>
            <p className="text-lg text-gray-200">Please wear your seat belt to access the dashboard.</p>
          </div>
          <div className="z-50">
            {/* The shield toggle button is already above the overlay due to z-50 */}
          </div>
        </div>
      )}

      {/* Main Content (disabled when seatBeltOn is false) */}
      <main className={`max-w-7xl mx-auto px-6 py-6 ${!seatBeltOn ? 'pointer-events-none select-none opacity-40' : ''}`}> 
        <div ref={contentRef} className="space-y-6">
          {/* Real-time Data Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Speed Data Card */}
            <div className={`p-4 rounded-xl shadow-lg border-l-4 border-blue-500 transition-all duration-300 hover:shadow-xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-600'}`}>Recommended Speed</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {speedData ? `${speedData.predicted_speed_kmph?.toFixed(1) || '0'} km/h` : 'N/A'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <Gauge className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              {speedData && (
                <div className={`mt-2 text-xs ${darkMode ? 'text-white' : 'text-gray-500'}`}>
                  <div>Accel X: {speedData.accel_x?.toFixed(2)}</div>
                  <div>Accel Y: {speedData.accel_y?.toFixed(2)}</div>
                  <div className="text-blue-500 dark:text-blue-300 font-semibold">ML Predicted</div>
                </div>
              )}
            </div>

            {/* Obstacle Data Card */}
            <div className={`p-4 rounded-xl shadow-lg border-l-4 border-red-500 transition-all duration-300 hover:shadow-xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-600'}`}>Obstacle Analysis</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {obstacleData ? `${obstacleData.distance_cm?.toFixed(1) || '0'} cm` : 'N/A'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              {obstacleData && (
                <div className={`mt-2 text-xs ${darkMode ? 'text-white' : 'text-gray-500'}`}>
                  <div className={`font-semibold ${obstacleData.obstacle_detected ? 'text-red-500 dark:text-red-300' : 'text-green-500 dark:text-green-300'}`}>
                    {obstacleData.obstacle_detected ? '⚠️ Obstacle Detected' : '✅ Clear Path'}
                  </div>
                  <div className="text-red-500 dark:text-red-300 font-semibold">AI Analyzed</div>
                </div>
              )}
            </div>

            {/* Engine Data Card */}
            <div className={`p-4 rounded-xl shadow-lg border-l-4 border-green-500 transition-all duration-300 hover:shadow-xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-600'}`}>Engine Status</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {engineData ? `${engineData.engine_temperature?.toFixed(1) || '0'}°C` : 'N/A'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
              {engineData && (
                <div className={`mt-2 text-xs ${darkMode ? 'text-white' : 'text-gray-500'}`}>
                  <div>Humidity: {engineData.engine_humidity?.toFixed(1)}%</div>
                  {/* Only show temperature-related faults, not humidity faults */}
                  {engineData.fault_status && engineData.fault_status.toLowerCase().includes('temperature') && (
                    <div className="font-semibold text-red-500 dark:text-red-300">
                      {engineData.fault_status}
                    </div>
                  )}
                  {engineData.fault_status && !engineData.fault_status.toLowerCase().includes('temperature') && !engineData.fault_status.toLowerCase().includes('humidity') && (
                    <div className="font-semibold text-red-500 dark:text-red-300">
                      {engineData.fault_status}
                    </div>
                  )}
                  {(!engineData.fault_status || (engineData.fault_status.toLowerCase().includes('humidity'))) && (
                    <div className="font-semibold text-green-500 dark:text-green-300">
                      Normal
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Task Count Card */}
            <div className={`p-4 rounded-xl shadow-lg border-l-4 border-yellow-500 transition-all duration-300 hover:shadow-xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-600'}`}>Scheduled Tasks</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{taskData.length}</p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                  <ClipboardList className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className={`mt-2 text-xs ${darkMode ? 'text-white' : 'text-gray-500'}`}>
                <div>Total Logs: {logs.length}</div>
              </div>
            </div>
          </div>

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Example: Completed Tasks */}
                <div className={`p-4 rounded-xl shadow-lg border-l-4 border-blue-500 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-600'}`}>Total Tasks</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{taskData.length}</p>
                    </div>
                  </div>
                </div>
                {/* Add more cards for speed, obstacle, etc. as needed */}
              </div>

              {/* Tasks List */}
              <div className={`rounded-xl shadow-lg border-gray-200 dark:border-gray-700 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Task Schedule</h2>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Task Schedule</h2>
                    <button
                      onClick={fetchTaskHistory}
                      className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm"
                      disabled={taskLoading}
                    >
                      {taskLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      <thead>
                        <tr>
                          <th className={`px-4 py-2 text-left font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#</th>
                          <th className={`px-4 py-2 text-left font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Task Name</th>
                          <th className={`px-4 py-2 text-left font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Predicted Time (min)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taskLoading ? (
                          <tr><td colSpan={3} className={`text-center py-4 ${darkMode ? 'text-white' : 'text-gray-500'}`}>Loading...</td></tr>
                        ) : taskData.length === 0 ? (
                          <>
                            <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                              <td className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>1</td>
                              <td className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Boulder Clearing</td>
                              <td className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>128.5</td>
                            </tr>
                            <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                              <td className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>2</td>
                              <td className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Road Repair</td>
                              <td className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>56.0</td>
                            </tr>
                            <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                              <td className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>3</td>
                              <td className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Foundation Excavation</td>
                              <td className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>180.0</td>
                            </tr>
                          </>
                        ) : (
                          taskData.map((task, idx) => (
                            <tr key={idx} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                              <td className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{idx + 1}</td>
                              <td className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{task.task_name}</td>
                              <td className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{task.predicted_time_minutes}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className={`rounded-xl shadow-lg border-gray-200 dark:border-gray-700 p-4 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Logs</h2>
              {loading ? (
                <div className="text-center py-8">
                  <p className={`${darkMode ? 'text-white' : 'text-gray-500'}`}>Loading logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className={`${darkMode ? 'text-white' : 'text-gray-500'}`}>No logs yet.</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={`mb-2 p-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`text-xs ${darkMode ? 'text-white' : 'text-gray-400'}`}>{log.timestamp}</div>
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{log.event_type || log.taskName}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Incidents Tab */}
          {activeTab === 'incidents' && (
            <div className="space-y-6">
              <IncidentLogger darkMode={darkMode} user={user} />
            </div>
          )}

          {/* Add similar sections for speedData and obstacleData if needed */}
        </div>
      </main>



      {/* Learning Tab */}
      {activeTab === 'learning' && (
        <div className="space-y-6">
          {/* Learning Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {learningModules.map((module) => (
                    <div
                      key={module.id}
                className={`p-6 rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}
                      onClick={() => module.type === 'quiz' ? startQuiz() : setSelectedLearningModule(module)}
                    >
                      <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                          {module.icon}
                        </div>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    module.type === 'quiz' ? 'bg-yellow-100 text-yellow-800' :
                    module.type === 'video' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {module.type}
                        </span>
                      </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {module.title}
                      </h3>
                      <p className={`text-sm mb-4 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {module.description}
                      </p>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {module.duration}
                          </span>
                  {module.type === 'quiz' ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); startQuiz(); }}
                      className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Start Quiz
                    </button>
                  ) : (
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-yellow-500 rounded-full transition-all duration-300"
                            style={{ width: `${module.progress}%` }}
                          />
                        </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

          {/* Quiz Modal */}
          {quizActive && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`max-w-md w-full mx-4 p-6 rounded-xl shadow-2xl ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                {!quizCompleted ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                          <h3 className={`text-xl font-bold ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                        Caterpillar Vehicle Quiz
                          </h3>
                          <span className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                        {currentQuestion + 1} / {quizQuestions.length}
                          </span>
                      </div>
                      
                      <div className="mb-6">
                      <p className={`text-lg mb-4 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {quizQuestions[currentQuestion].question}
                      </p>
                      
                        <div className="space-y-3">
                          {quizQuestions[currentQuestion].options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => selectAnswer(index)}
                            className={`w-full p-3 text-left rounded-lg border-2 transition-all duration-200 ${
                                selectedAnswer === index 
                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                  : darkMode 
                                  ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                              }`}
                            >
                            <span className={`${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {option}
                            </span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <button
                          onClick={() => setQuizActive(false)}
                        className={`px-4 py-2 rounded-lg ${
                            darkMode 
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                          }`}
                        >
                          Exit Quiz
                        </button>
                        <button
                          onClick={nextQuestion}
                          disabled={selectedAnswer === null}
                        className={`px-6 py-2 rounded-lg ${
                          selectedAnswer === null
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'caterpillar-yellow text-black hover:bg-yellow-600'
                        }`}
                        >
                          {currentQuestion === quizQuestions.length - 1 ? 'Finish' : 'Next'}
                        </button>
                      </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 caterpillar-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-black" />
                    </div>
                        <h3 className={`text-2xl font-bold mb-2 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                      Quiz Complete!
                        </h3>
                    <p className={`text-lg mb-4 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Your score: {quizScore} / {quizQuestions.length}
                    </p>
                    <p className={`text-sm mb-6 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {quizScore === quizQuestions.length ? 'Perfect! You\'re a Caterpillar expert!' :
                       quizScore >= quizQuestions.length * 0.8 ? 'Great job! You know your Caterpillar machines!' :
                       quizScore >= quizQuestions.length * 0.6 ? 'Good effort! Keep learning!' :
                       'Keep studying Caterpillar safety and operations!'}
                    </p>
                    <div className="flex space-x-3">
                        <button
                        onClick={() => {
                          setQuizActive(false);
                          setQuizCompleted(false);
                        }}
                        className={`px-4 py-2 rounded-lg ${
                          darkMode
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`}
                      >
                        Close
                        </button>
                        <button
                        onClick={() => {
                          setQuizCompleted(false);
                          startQuiz();
                        }}
                        className="px-6 py-2 caterpillar-yellow text-black rounded-lg hover:bg-yellow-600"
                        >
                          Retake Quiz
                        </button>
                      </div>
                    </div>
                  )}
              </div>
                </div>
              )}

          {/* Learning Module Modal */}
          {selectedLearningModule && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        {selectedLearningModule.icon}
                      </div>
                      <div>
                        <h2 className={`text-2xl font-bold ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {selectedLearningModule.title}
                        </h2>
                        <p className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Duration: {selectedLearningModule.duration} | Progress: {selectedLearningModule.progress}%
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedLearningModule(null)}
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="space-y-6">
                    {/* Main Description */}
                    <div>
                      <p className={`text-lg leading-relaxed ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {selectedLearningModule.content?.text}
                      </p>
                    </div>

                    {/* YouTube Video */}
                    {selectedLearningModule.content?.youtubeUrl && (
                      <div>
                        <h3 className={`text-xl font-semibold mb-3 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          📺 Video Tutorial
                        </h3>
                        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                          <iframe
                            src={selectedLearningModule.content.youtubeUrl.replace('watch?v=', 'embed/')}
                            title={selectedLearningModule.title}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}

                    {/* Sections */}
                    {selectedLearningModule.content?.sections && (
                      <div>
                        <h3 className={`text-xl font-semibold mb-4 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          �� Learning Sections
                        </h3>
                        <div className="space-y-4">
                          {selectedLearningModule.content.sections.map((section, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border ${
                                darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <h4 className={`font-semibold mb-2 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {section.title}
                              </h4>
                              <p className={`text-sm leading-relaxed ${
                                darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {section.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress Section */}
                    <div className={`p-4 rounded-lg ${
                      darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-semibold ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Your Progress
                        </span>
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {selectedLearningModule.progress}% Complete
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${selectedLearningModule.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setSelectedLearningModule(null)}
                      className={`px-4 py-2 rounded-lg ${
                        darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      }`}
                    >
                      Close
                    </button>
                    {selectedLearningModule.type === 'quiz' && (
                      <button
                        onClick={() => {
                          setSelectedLearningModule(null);
                          startQuiz();
                        }}
                        className="px-6 py-2 caterpillar-yellow text-black rounded-lg hover:bg-yellow-600"
                      >
                        Start Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
          )}
    </div>
  );
};

export default Dashboard;