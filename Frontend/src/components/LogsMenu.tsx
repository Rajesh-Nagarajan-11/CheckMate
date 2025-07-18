import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  FileText, 
  Clock, 
  Fuel, 
  Gauge, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle,
  Filter,
  Download,
  Search,
  Calendar
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  vehicleId: string;
  operatorId: string;
  fuelUsed: number;
  engineIdleTime: number;
  loadCycles: number;
  taskCompletionTime: number;
  taskName: string;
  status: 'completed' | 'in-progress' | 'failed';
}

interface LogsMenuProps {
  darkMode: boolean;
  user: any;
}

const LogsMenu: React.FC<LogsMenuProps> = ({ darkMode, user }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const logsRef = useRef<HTMLDivElement>(null);

  // Generate mock log data
  useEffect(() => {
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        vehicleId: 'CAT-EX-001',
        operatorId: user.id,
        fuelUsed: 45.2,
        engineIdleTime: 15,
        loadCycles: 127,
        taskCompletionTime: 240,
        taskName: 'Excavate Site A',
        status: 'completed'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        vehicleId: 'CAT-EX-001',
        operatorId: user.id,
        fuelUsed: 32.8,
        engineIdleTime: 8,
        loadCycles: 89,
        taskCompletionTime: 180,
        taskName: 'Complete Machine Checks',
        status: 'completed'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        vehicleId: 'CAT-EX-001',
        operatorId: user.id,
        fuelUsed: 28.5,
        engineIdleTime: 12,
        loadCycles: 65,
        taskCompletionTime: 150,
        taskName: 'Safety Inspection',
        status: 'completed'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        vehicleId: 'CAT-EX-001',
        operatorId: user.id,
        fuelUsed: 15.3,
        engineIdleTime: 5,
        loadCycles: 34,
        taskCompletionTime: 0,
        taskName: 'Update Progress Report',
        status: 'in-progress'
      }
    ];
    setLogs(mockLogs);
    setFilteredLogs(mockLogs);
  }, [user.id]);

  useEffect(() => {
    gsap.fromTo(logsRef.current, 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );
  }, []);

  useEffect(() => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.vehicleId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(log => 
        log.timestamp.toDateString() === now.toDateString()
      );
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(log => log.timestamp >= weekAgo);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, statusFilter, dateFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'in-progress': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div ref={logsRef} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Operation Logs
        </h2>
        <button className="flex items-center space-x-2 px-4 py-2 caterpillar-yellow text-black rounded-lg hover:bg-yellow-600 transition-colors">
          <Download className="w-4 h-4" />
          <span className="font-medium">Export</span>
        </button>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-xl ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } shadow-lg`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>

          <div className="flex items-center space-x-2">
            <Filter className={`w-4 h-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <span className={`text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {filteredLogs.length} entries
            </span>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className={`rounded-xl shadow-lg overflow-hidden ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Task & Status
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Vehicle ID
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Fuel Used
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Idle Time
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Load Cycles
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Duration
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              darkMode ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              {filteredLogs.map((log, index) => (
                <tr 
                  key={log.id}
                  className={`hover:bg-opacity-50 transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                  style={{
                    animation: `slideInUp 0.3s ease-out ${index * 0.1}s both`
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(log.status)
                      }`}>
                        {getStatusIcon(log.status)}
                        <span className="ml-1 capitalize">{log.status.replace('-', ' ')}</span>
                      </span>
                      <span className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {log.taskName}
                      </span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm font-mono ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {log.vehicleId}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Fuel className="w-4 h-4 text-blue-500" />
                      <span className={`text-sm font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {log.fuelUsed}L
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className={`text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {formatTime(log.engineIdleTime)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <RotateCcw className="w-4 h-4 text-green-500" />
                      <span className={`text-sm font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {log.loadCycles}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Gauge className="w-4 h-4 text-purple-500" />
                      <span className={`text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {log.status === 'in-progress' ? 'Ongoing' : formatTime(log.taskCompletionTime)}
                      </span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {log.timestamp.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <div className={`text-center py-12 ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No logs found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default LogsMenu;