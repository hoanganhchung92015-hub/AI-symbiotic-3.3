
import React, { useState, useRef, useCallback } from 'react';
import { Subject, InputMethod, AIResponse, HistoryItem } from './types';
import { processLearningRequest } from './services/aiService';
import { 
  Calculator, 
  BookOpen, 
  Search, 
  Gavel, 
  Share2, 
  Camera, 
  Upload, 
  Mic, 
  Send,
  Loader2,
  ChevronRight,
  History as HistoryIcon,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

export default function App() {
  const [subject, setSubject] = useState<Subject>(Subject.MATH);
  const [inputMethod, setInputMethod] = useState<InputMethod>(InputMethod.TEXT);
  const [inputText, setInputText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setInputMethod(InputMethod.CAMERA);
    } catch (err) {
      alert("Không thể truy cập Camera.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const data = canvasRef.current.toDataURL('image/jpeg');
      setImagePreview(data);
      stopCamera();
      setInputMethod(InputMethod.TEXT); // Back to text mode to review prompt
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
        setInputMethod(InputMethod.TEXT);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev + ' ' + transcript);
    };

    recognition.start();
  };

  const handleSubmit = async () => {
    if (!inputText && !imagePreview) return;
    setIsProcessing(true);
    setResult(null);

    try {
      const response = await processLearningRequest(subject, inputText || "Phân tích nội dung trong ảnh", imagePreview || undefined);
      setResult(response);
      
      const newHistory: HistoryItem = {
        id: Date.now().toString(),
        subject,
        timestamp: Date.now(),
        input: inputText,
        image: imagePreview || undefined,
        response
      };
      setHistory([newHistory, ...history]);
    } catch (error) {
      alert("Có lỗi xảy ra khi xử lý.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setImagePreview(null);
    setInputText('');
    stopCamera();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg">
            <Share2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AISymbi</h1>
            <p className="text-sm text-slate-500 font-medium">Hệ Thống Học Tập Cộng Sinh AI</p>
          </div>
        </div>

        <nav className="flex bg-slate-200 p-1 rounded-full gap-1">
          {Object.values(Subject).map(s => (
            <button
              key={s}
              onClick={() => { setSubject(s); reset(); }}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                subject === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Input Sidebar / Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ChevronRight size={18} className="text-blue-500" /> Nhập Liệu
            </h2>

            <div className="space-y-4">
              {/* Input Method Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                >
                  <Camera className="text-slate-500 group-hover:text-blue-500 mb-1" size={20} />
                  <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-blue-500">Camera</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                >
                  <Upload className="text-slate-500 group-hover:text-blue-500 mb-1" size={20} />
                  <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-blue-500">Tải Ảnh</span>
                </button>
                <button 
                  onClick={handleVoiceInput}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all group ${
                    isRecording ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <Mic className={`${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-500 group-hover:text-blue-500'} mb-1`} size={20} />
                  <span className={`text-[10px] font-bold uppercase ${isRecording ? 'text-red-500' : 'text-slate-400 group-hover:text-blue-500'}`}>Giọng Nói</span>
                </button>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />

              {/* Camera Live View */}
              {inputMethod === InputMethod.CAMERA && (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-inner">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button onClick={capturePhoto} className="bg-white p-3 rounded-full shadow-lg hover:scale-110 transition-all">
                      <Camera size={24} className="text-blue-600" />
                    </button>
                    <button onClick={stopCamera} className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all">
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-auto" />
                  <button 
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* Text Input */}
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Hỏi AI về bài tập hoặc kiến thức..."
                  className="w-full min-h-[120px] p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all resize-none"
                />
                <button
                  disabled={isProcessing || (!inputText && !imagePreview)}
                  onClick={handleSubmit}
                  className="absolute bottom-3 right-3 bg-blue-600 text-white p-2 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* History / Contributions Section */}
          <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200/50">
            <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-4">
              <HistoryIcon size={16} /> Lịch sử học tập
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chưa có câu hỏi nào được lưu.</p>
              ) : (
                history.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => setResult(item.response)}
                    className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 transition-all group flex items-start gap-3"
                  >
                    {item.image ? <ImageIcon size={14} className="mt-1 text-blue-400" /> : <BookOpen size={14} className="mt-1 text-slate-400" />}
                    <span className="text-xs font-medium text-slate-600 line-clamp-2">{item.input || "Phân tích ảnh"}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-8 space-y-6">
          {!result && !isProcessing && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 p-8 border-2 border-dashed border-slate-200 rounded-3xl">
              <div className="bg-blue-50 p-6 rounded-full text-blue-400">
                <Search size={48} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Sẵn sàng phân tích</h3>
                <p className="text-slate-500 max-w-sm">Hãy nhập câu hỏi, chụp ảnh đề bài hoặc nói để AI hỗ trợ bạn theo nhiều góc độ.</p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 p-8 bg-white rounded-3xl shadow-sm">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Share2 className="text-blue-600 animate-pulse" size={24} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">Copilot đang điều phối...</h3>
                <p className="text-slate-500 animate-pulse">Các AI chuyên biệt (Socratic, NotebookLM, Perplexity...) đang xử lý yêu cầu của bạn.</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Responsive Grid of AI Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Socratic */}
                <ResultCard 
                  title="Socratic (Từng Bước)" 
                  icon={<BookOpen size={20} />} 
                  color="blue"
                  content={result.socratic} 
                />
                
                {/* 2. NotebookLM */}
                <ResultCard 
                  title="NotebookLM (Lý Thuyết)" 
                  icon={<Search size={20} />} 
                  color="indigo"
                  content={result.notebookLM} 
                />

                {/* 3. Perplexity */}
                <ResultCard 
                  title="Perplexity (Mở Rộng)" 
                  icon={<Share2 size={20} />} 
                  color="emerald"
                  content={result.perplexity} 
                />

                {/* 4. Specialized */}
                <ResultCard 
                  title={
                    subject === Subject.MATH ? "Casio 580 (Tính Toán)" : 
                    subject === Subject.ECON_LAW ? "Văn Bản Luật (Trích Dẫn)" : "Tư Liệu (Lịch Sử)"
                  } 
                  icon={subject === Subject.MATH ? <Calculator size={20} /> : <Gavel size={20} />} 
                  color="amber"
                  content={result.specialized} 
                />
              </div>

              {/* 5. Diagram AI (Wide) */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-10 opacity-50"></div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
                    <Share2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Hệ Thống Hóa Kiến Thức</h3>
                    <p className="text-xs text-slate-500">Sơ đồ tư duy / Logic bài học</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <pre className="mono text-xs md:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {result.diagram}
                  </pre>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => window.print()}
                  className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2"
                >
                  <Search size={16} /> Xuất PDF Bài Học
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

interface ResultCardProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  color: 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple';
}

function ResultCard({ title, icon, content, color }: ResultCardProps) {
  const colorMap = {
    blue: 'border-blue-100 bg-blue-50/30 text-blue-600',
    indigo: 'border-indigo-100 bg-indigo-50/30 text-indigo-600',
    emerald: 'border-emerald-100 bg-emerald-50/30 text-emerald-600',
    amber: 'border-amber-100 bg-amber-50/30 text-amber-600',
    purple: 'border-purple-100 bg-purple-50/30 text-purple-600',
  };

  const badgeMap = {
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className={`bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col h-full hover:shadow-lg transition-shadow`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${badgeMap[color]}`}>
          {icon}
        </div>
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap flex-grow">
        {content}
      </div>
    </div>
  );
}
