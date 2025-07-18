import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { 
  AlertTriangle, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Save, 
  Trash2, 
  Clock,
  MapPin,
  User,
  FileText,
  Volume2,
  Plus,
  X
} from 'lucide-react';

interface IncidentReport {
  id: string;
  timestamp: Date;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  audioBlob?: Blob;
  audioUrl?: string;
  operatorId: string;
  vehicleId: string;
  status: 'draft' | 'submitted';
}

interface IncidentLoggerProps {
  darkMode: boolean;
  user: any;
}

const IncidentLogger: React.FC<IncidentLoggerProps> = ({ darkMode, user }) => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [showSimpleForm, setShowSimpleForm] = useState(false);
  const [currentIncident, setCurrentIncident] = useState<Partial<IncidentReport>>({
    severity: 'medium',
    location: '',
    description: '',
    operatorId: user.id,
    vehicleId: 'CAT-EX-001'
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const incidentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(incidentRef.current, 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    // Load existing incidents from localStorage
    const savedIncidents = localStorage.getItem('caterpillar-incidents');
    if (savedIncidents) {
      try {
        setIncidents(JSON.parse(savedIncidents));
      } catch (error) {
        console.error('Error loading incidents:', error);
      }
    } else {
      // Insert mock data if no incidents exist
      const mockIncidents = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 3600 * 1000),
          location: 'Site A',
          severity: 'medium' as 'medium',
          description: 'Hydraulic leak detected under main arm. Operator noticed fluid on ground during inspection.',
          operatorId: user.id,
          vehicleId: 'CAT-EX-001',
          status: 'submitted' as 'submitted',
          audioBlob: undefined,
          audioUrl: undefined,
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 2 * 3600 * 1000),
          location: 'Zone 3',
          severity: 'high' as 'high',
          description: 'Engine overheating warning triggered. Machine was stopped and allowed to cool.',
          operatorId: user.id,
          vehicleId: 'CAT-EX-002',
          status: 'submitted' as 'submitted',
          audioBlob: undefined,
          audioUrl: undefined,
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 5 * 3600 * 1000),
          location: 'Loading Bay',
          severity: 'low' as 'low',
          description: 'Loose handrail found during pre-operation check. Marked for maintenance.',
          operatorId: user.id,
          vehicleId: 'CAT-EX-003',
          status: 'submitted' as 'submitted',
          audioBlob: undefined,
          audioUrl: undefined,
        }
      ];
      setIncidents(mockIncidents);
    }
  }, []);

  useEffect(() => {
    if (showSimpleForm && formRef.current) {
      gsap.fromTo(formRef.current, 
        { opacity: 0, scale: 0.9, y: 20 }, 
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [showSimpleForm]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setCurrentIncident(prev => ({
          ...prev,
          audioBlob,
          audioUrl
        }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const playAudio = (audioUrl: string, incidentId: string) => {
    if (isPlaying === incidentId) {
      setIsPlaying(null);
      return;
    }

    const audio = new Audio(audioUrl);
    setIsPlaying(incidentId);
    
    audio.onended = () => setIsPlaying(null);
    audio.play();
  };

  const saveIncident = () => {
    if (!currentIncident.description && !currentIncident.audioUrl) {
      return;
    }

    const newIncident: IncidentReport = {
      id: Date.now().toString(),
      timestamp: new Date(),
      location: currentIncident.location || 'Site A',
      severity: currentIncident.severity || 'medium',
      description: currentIncident.description || '',
      audioBlob: currentIncident.audioBlob,
      audioUrl: currentIncident.audioUrl,
      operatorId: user.id,
      vehicleId: currentIncident.vehicleId || 'CAT-EX-001',
      status: 'submitted'
    };

    const updatedIncidents = [newIncident, ...incidents];
    setIncidents(updatedIncidents);
    localStorage.setItem('caterpillar-incidents', JSON.stringify(updatedIncidents));

    // Reset form
    setCurrentIncident({
      severity: 'medium',
      location: '',
      description: '',
      operatorId: user.id,
      vehicleId: 'CAT-EX-001'
    });
    setShowSimpleForm(false);
    setRecordingTime(0);
  };

  const deleteIncident = (id: string) => {
    const updatedIncidents = incidents.filter(incident => incident.id !== id);
    setIncidents(updatedIncidents);
    localStorage.setItem('caterpillar-incidents', JSON.stringify(updatedIncidents));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={incidentRef} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Incident Reports
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSimpleForm(true)}
            className="flex items-center space-x-2 px-4 py-2 caterpillar-yellow text-black rounded-lg hover:bg-yellow-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Report</span>
          </button>
        </div>
      </div>

      {/* Simple Form Modal */}
      {showSimpleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg rounded-xl shadow-2xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Incident Report Form
                </h3>
                <button
                  onClick={() => setShowSimpleForm(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Incident Type
                  </label>
                  <div className="space-y-2">
                    <label className={`flex items-center space-x-3 cursor-pointer ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <input
                        type="radio"
                        name="incidentType"
                        value="equipment"
                        className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                      />
                      <span>Equipment Failure</span>
                    </label>
                    <label className={`flex items-center space-x-3 cursor-pointer ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <input
                        type="radio"
                        name="incidentType"
                        value="safety"
                        className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                      />
                      <span>Safety Incident</span>
                    </label>
                    <label className={`flex items-center space-x-3 cursor-pointer ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <input
                        type="radio"
                        name="incidentType"
                        value="maintenance"
                        className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                      />
                      <span>Maintenance Issue</span>
                    </label>
                    <label className={`flex items-center space-x-3 cursor-pointer ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <input
                        type="radio"
                        name="incidentType"
                        value="environmental"
                        className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                      />
                      <span>Environmental Concern</span>
                    </label>
                    <label className={`flex items-center space-x-3 cursor-pointer ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <input
                        type="radio"
                        name="incidentType"
                        value="other"
                        className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                      />
                      <span>Other</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Incident Title
                  </label>
                  <input
                    type="text"
                    placeholder="Enter incident title..."
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description
                  </label>
                  <textarea
                    placeholder="Provide a detailed description of the incident..."
                    rows={4}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Please include relevant details such as location, time, people involved, and any immediate actions taken.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowSimpleForm(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'border border-gray-600 hover:bg-gray-700 text-white' 
                        : 'border border-gray-300 hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveIncident}
                    className="px-4 py-2 caterpillar-yellow text-black rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incidents List */}
      <div className="space-y-3">
        {incidents.map((incident, index) => (
          <div
            key={incident.id}
            className={`p-4 rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            style={{
              animation: `slideInUp 0.3s ease-out ${index * 0.1}s both`
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getSeverityColor(incident.severity)
                  }`}>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {incident.severity.toUpperCase()}
                  </span>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{incident.timestamp.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      {incident.location}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4 text-green-500" />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      {incident.vehicleId}
                    </span>
                  </div>
                </div>

                {incident.description && (
                  <p className={`mb-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {incident.description}
                  </p>
                )}

                {incident.audioUrl && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => playAudio(incident.audioUrl!, incident.id)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isPlaying === incident.id ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      <span className="text-sm">Voice Note</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => deleteIncident(incident.id)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-red-600'
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {incidents.length === 0 && (
          <div className={`text-center py-12 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No incident reports found</p>
            <p className="text-sm mt-2">Click "New Report" to create your first incident report</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentLogger;