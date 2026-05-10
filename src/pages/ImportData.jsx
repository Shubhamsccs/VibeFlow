import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, Table } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export default function ImportData() {
  const [csvData, setCsvData] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });
  const addTask = useTaskStore(state => state.addTask);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    try {
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const results = lines.slice(1)
        .filter(line => line.trim() !== '')
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj = {};
          headers.forEach((header, i) => {
            obj[header] = values[i];
          });
          return obj;
        });

      setCsvData(results);
      setStatus({ type: 'success', message: `Successfully parsed ${results.length} records.` });
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to parse CSV. Please check the format.' });
    }
  };

  const handleImport = () => {
    if (csvData.length === 0) return;
    
    setIsImporting(true);
    let count = 0;

    csvData.forEach(row => {
      // Find the correct keys (handling case sensitivity and exact names from image)
      const activityKey = Object.keys(row).find(k => k.toLowerCase() === 'activity');
      const activityValue = row[activityKey] || 'Untitled Activity';
      const durationKey = Object.keys(row).find(k => k.toLowerCase().includes('duration'));
      const startKey = Object.keys(row).find(k => k.toLowerCase().includes('start time'));
      const endKey = Object.keys(row).find(k => k.toLowerCase().includes('end time'));
      const moodKey = Object.keys(row).find(k => k.toLowerCase() === 'mood');

      const startValue = row[startKey] || '';
      const endValue = row[endKey] || '';
      
      // Calculate duration from start/end if available
      let calculatedDuration = row[durationKey] || '';
      if (startValue && endValue) {
        try {
          const s = new Date(startValue.replace(/-/g, '/'));
          const e = new Date(endValue.replace(/-/g, '/'));
          if (!isNaN(s) && !isNaN(e)) {
            const diffMs = e - s;
            const diffMins = Math.floor(diffMs / 60000);
            const hrs = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            calculatedDuration = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
          }
        } catch (err) {
          console.error("Duration calc failed", err);
        }
      }

      // Extract date for the calendar
      let dueDate = new Date().toISOString().split('T')[0];
      if (startValue) {
        try {
          const datePart = startValue.split(' ')[0];
          const parts = datePart.split(/[-/]/);
          if (parts.length === 3) {
            if (parseInt(parts[0]) > 12) {
              dueDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            } else {
              dueDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            }
          }
        } catch (e) {
          console.error("Date parsing failed", e);
        }
      }

      const task = {
        id: crypto.randomUUID(),
        title: activityValue,
        description: '',
        duration: calculatedDuration,
        startTime: startValue,
        endTime: endValue,
        mood: parseInt(row[moodKey] || 3),
        priority: 'medium',
        status: 'done',
        category: mapStatus(activityValue),
        dueDate: dueDate,
        createdAt: startValue ? new Date(startValue.replace(/-/g, '/')).toISOString() : new Date().toISOString(),
        tags: []
      };

      if (isNaN(task.mood)) task.mood = 3;

      addTask(task);
      count++;
    });

    setIsImporting(false);
    setCsvData([]);
    setStatus({ type: 'success', message: `Imported ${count} completed activities successfully!` });
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to delete ALL your task data? This cannot be undone.")) {
      useTaskStore.persist.clearStorage();
      window.location.reload();
    }
  };

  const mapStatus = (activityName) => {
    const name = activityName.toLowerCase().trim();
    if (name.includes('college')) return 'college';
    if (name.includes('my space') || name.includes('myspace')) return 'myspace';
    if (name.includes('java') || name.includes('dsa java')) return 'dsa-java';
    if (name.includes('web development') || name.includes('web dev')) return 'web-dev';
    if (name.includes('practice')) return 'dsa-practice';
    if (name.includes('done') || name.includes('finished')) return 'done';
    return 'college'; // Default to first column
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Activity Migration</h1>
          <p className="text-slate-400">
            Seamlessly import your data from other activity tracking apps.
          </p>
        </div>
        <button 
          onClick={handleClearData}
          className="text-xs font-bold text-brand-danger/60 hover:text-brand-danger border border-brand-danger/20 hover:border-brand-danger/40 px-4 py-2 rounded-lg transition-all"
        >
          Reset All Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="glass-panel rounded-2xl p-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-brand-primary/50 transition-all group relative overflow-hidden bg-slate-900/20">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="w-20 h-20 rounded-3xl bg-brand-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-10 h-10 text-brand-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">Drop Activity File</h3>
          <p className="text-sm text-slate-400 text-center max-w-[240px]">
            Drag and drop your CSV file (e.g. from your tracking app)
          </p>
        </div>

        {/* Requirements / Tips */}
        <div className="glass-panel rounded-2xl p-8 space-y-6 bg-slate-900/40 border-slate-800">
          <h3 className="text-lg font-bold flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-brand-primary" />
            </div>
            Expected Format
          </h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            {[
              "activity",
              "duration (hr:min:sec)",
              "start time",
              "end time",
              "mood"
            ].map((col, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-success" />
                <span className="font-mono">{col}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 italic">
              * Note: We'll automatically map categories like 'College Work', 'My Space', 'DSA Java', 'Web Development' etc.
            </p>
          </div>
        </div>
      </div>

      {status.message && (
        <div className={`p-5 rounded-2xl flex items-center gap-4 border animate-slide-in ${
          status.type === 'success' ? 'bg-brand-success/10 border-brand-success/20 text-brand-success' : 'bg-brand-danger/10 border-brand-danger/20 text-brand-danger'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            status.type === 'success' ? 'bg-brand-success/20' : 'bg-brand-danger/20'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <p className="font-bold">Import Status</p>
            <p className="text-sm opacity-90">{status.message}</p>
          </div>
        </div>
      )}

      {csvData.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/50 flex flex-col shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Table className="w-5 h-5 text-brand-primary" />
                Data Preview
              </h3>
              <p className="text-xs text-slate-400 mt-1">Found {csvData.length} records ready for import</p>
            </div>
            <button 
              onClick={handleImport}
              disabled={isImporting}
              className="btn-primary py-2.5 px-8 rounded-full font-bold shadow-lg shadow-brand-primary/20 disabled:opacity-50 hover:scale-105 transition-transform"
            >
              {isImporting ? 'Processing...' : 'Migrate Now'}
            </button>
          </div>
          <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 sticky top-0 z-10">
                  {Object.keys(csvData[0]).map(header => (
                    <th key={header} className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {csvData.map((row, i) => (
                  <tr key={i} className="hover:bg-brand-primary/5 transition-colors group">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-5 py-4 text-sm text-slate-300 group-hover:text-white transition-colors">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
