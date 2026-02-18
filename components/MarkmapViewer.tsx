import React, { useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Maximize2, Minimize2 } from 'lucide-react';

interface MarkmapViewerProps {
  content: string;
  className?: string;
  fitView?: boolean;
}

const transformer = new Transformer();

export const MarkmapViewer: React.FC<MarkmapViewerProps> = ({ content, className, fitView = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (svgRef.current && !mmRef.current) {
      mmRef.current = Markmap.create(svgRef.current);
    }
    
    if (mmRef.current) {
      const { root } = transformer.transform(content);
      mmRef.current.setData(root);
      if (fitView) {
        mmRef.current.fit();
      }
    }
  }, [content, fitView]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (mmRef.current) mmRef.current.fit();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden ${className} ${isFullscreen ? 'p-0' : ''}`}>
      <button 
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white text-slate-600 rounded-full shadow-md backdrop-blur-sm transition-all"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
};
