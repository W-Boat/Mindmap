import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMindMapById, saveMindMap } from '../services/storageService';
import { generateMindMapContent } from '../services/aiService';
import { MindMap } from '../types';
import { MarkmapViewer } from '../components/MarkmapViewer';
import { DEFAULT_MARKDOWN } from '../constants';
import { Save, Sparkles, Layout, Code, Loader2, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState(DEFAULT_MARKDOWN);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  
  // Responsive: on large screens show both, small screens show tabs
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (id) {
      loadMindMap();
    }
  }, [id, navigate]);

  const loadMindMap = async () => {
    try {
      const map = await getMindMapById(id!);
      if (map) {
        setTitle(map.title);
        setDescription(map.description || '');
        setContent(map.content);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading mind map:', error);
      navigate('/');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    const newMap: MindMap = {
      id: id || uuidv4(),
      title,
      description,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveMindMap(newMap);
    navigate('/');
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const generatedMarkdown = await generateMindMapContent(aiPrompt);
      setContent(generatedMarkdown);
      
      // Auto-set title if empty
      if (!title) {
        setTitle(aiPrompt.charAt(0).toUpperCase() + aiPrompt.slice(1));
      }
      if (!description) {
        setDescription(`AI generated map for: ${aiPrompt}`);
      }
    } catch (error) {
      console.error("Failed to generate", error);
      alert('Failed to generate content. Check console or ensure backend is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm z-10">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-700">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 md:flex-none">
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mind Map Title"
              className="font-bold text-lg md:text-xl bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-300 w-full"
            />
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a short description..."
              className="text-sm text-slate-500 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-300 w-full"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
           {/* Mobile Tabs Toggle */}
           <div className="md:hidden flex bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setActiveTab('editor')}
                className={`p-2 rounded-md transition-all ${activeTab === 'editor' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                <Code size={18} />
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={`p-2 rounded-md transition-all ${activeTab === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                <Layout size={18} />
              </button>
           </div>

           <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md shadow-indigo-200"
          >
            <Save size={18} />
            <span className="hidden sm:inline">Save Map</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Editor Panel */}
        <div className={`flex-1 flex flex-col border-r border-slate-200 bg-white transition-all ${isMobile && activeTab === 'preview' ? 'hidden' : 'flex'}`}>
          {/* AI Generator Box */}
          <div className="p-4 border-b border-slate-100 bg-indigo-50/30">
             <div className="flex gap-2">
               <div className="relative flex-1">
                 <Sparkles className="absolute left-3 top-3 text-indigo-500" size={16} />
                 <input 
                   type="text" 
                   value={aiPrompt}
                   onChange={(e) => setAiPrompt(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                   placeholder="Enter a topic to generate with DeepSeek AI..."
                   className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                 />
               </div>
               <button 
                 onClick={handleGenerate}
                 disabled={isGenerating || !aiPrompt}
                 className="bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 min-w-[100px] justify-center"
               >
                 {isGenerating ? <Loader2 size={16} className="animate-spin" /> : 'Generate'}
               </button>
             </div>
          </div>
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full resize-none p-6 font-mono text-sm leading-relaxed focus:outline-none text-slate-700"
            placeholder="# Root Topic&#10;## Subtopic 1&#10;- Idea A&#10;- Idea B"
            spellCheck={false}
          />
        </div>

        {/* Preview Panel */}
        <div className={`flex-1 bg-slate-50 relative ${isMobile && activeTab === 'editor' ? 'hidden' : 'block'}`}>
           <div className="absolute inset-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <MarkmapViewer content={content} className="w-full h-full" fitView={true} />
           </div>
        </div>

      </div>
    </div>
  );
};
