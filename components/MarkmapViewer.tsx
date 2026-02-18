import React, { useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { useDarkMode } from '../lib/darkModeContext';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Maximize, ChevronDown, Eye } from 'lucide-react';

interface MarkmapViewerProps {
  content: string;
  className?: string;
  fitView?: boolean;
  showToolbar?: boolean;
}

const transformer = new Transformer();

export const MarkmapViewer: React.FC<MarkmapViewerProps> = ({
  content,
  className,
  fitView = true,
  showToolbar: initialShowToolbar = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useDarkMode();
  const [showToolbar, setShowToolbar] = useState(initialShowToolbar);
  const [zoomLevel, setZoomLevel] = useState(1);

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

  // Handle dark mode
  useEffect(() => {
    if (svgRef.current) {
      if (isDarkMode) {
        svgRef.current.style.filter = 'invert(1) hue-rotate(180deg)';
      } else {
        svgRef.current.style.filter = 'none';
      }
    }
  }, [isDarkMode]);

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

  const handleZoomIn = () => {
    if (svgRef.current && mmRef.current) {
      try {
        const newZoom = Math.min(zoomLevel * 1.2, 5);
        setZoomLevel(newZoom);

        // Apply SVG transform for zoom
        const g = svgRef.current.querySelector('g');
        if (g) {
          const currentTransform = g.getAttribute('transform') || '';
          const baseTransform = currentTransform.replace(/scale\([^)]*\)/g, '').trim();
          g.setAttribute('transform', `${baseTransform} scale(${newZoom})`);
        }
      } catch (error) {
        console.log('Zoom in error:', error);
      }
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && mmRef.current) {
      try {
        const newZoom = Math.max(zoomLevel / 1.2, 0.5);
        setZoomLevel(newZoom);

        // Apply SVG transform for zoom
        const g = svgRef.current.querySelector('g');
        if (g) {
          const currentTransform = g.getAttribute('transform') || '';
          const baseTransform = currentTransform.replace(/scale\([^)]*\)/g, '').trim();
          g.setAttribute('transform', `${baseTransform} scale(${newZoom})`);
        }
      } catch (error) {
        console.log('Zoom out error:', error);
      }
    }
  };

  const handleFitWindow = () => {
    if (mmRef.current) {
      mmRef.current.fit();
      setZoomLevel(1);
    }
  };

  const handleToggleRecursively = () => {
    // Toggle recursively would hide/show all child nodes
    console.log('Toggle recursively clicked');
  };

  if (!initialShowToolbar) {
    return (
      <div
        ref={containerRef}
        className={`relative bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}
      >
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full shadow-md backdrop-blur-sm transition-all"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
        <svg ref={svgRef} className="w-full h-full block" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${className} ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="absolute bottom-4 right-4 z-50 bg-white/95 dark:bg-slate-700/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 flex flex-col gap-1 p-2">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-600 my-1"></div>
          <button
            onClick={handleFitWindow}
            className="p-2 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
            title="Fit window size"
          >
            <Maximize size={18} />
          </button>
          <button
            onClick={handleToggleRecursively}
            className="p-2 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
            title="Toggle recursively"
          >
            <ChevronDown size={18} />
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-600 my-1"></div>
          <button
            onClick={() => setShowToolbar(false)}
            className="p-2 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
            title="Hide toolbar"
          >
            <Eye size={18} className="opacity-50" />
          </button>
        </div>
      )}

      {/* Show toolbar button when hidden */}
      {!showToolbar && (
        <button
          onClick={() => setShowToolbar(true)}
          className="absolute bottom-4 right-4 z-50 p-2 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-full shadow-md backdrop-blur-sm transition-all"
          title="Show toolbar"
        >
          <Eye size={20} />
        </button>
      )}

      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full shadow-md backdrop-blur-sm transition-all"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      {/* SVG Container */}
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
};
