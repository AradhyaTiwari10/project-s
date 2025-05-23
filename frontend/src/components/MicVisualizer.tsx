import React, { useEffect, useRef } from 'react';
import styles from './MicVisualizer.module.css';

interface MicVisualizerProps {
  className?: string;
}

class AudioVisualizer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode | null = null;
  private processFrame: (data: Uint8Array) => void;
  private processError: () => void;
  private stream: MediaStream | null = null;

  constructor(audioContext: AudioContext, processFrame: (data: Uint8Array) => void, processError: () => void) {
    this.audioContext = audioContext;
    this.processFrame = processFrame;
    this.processError = processError;
    this.connectStream = this.connectStream.bind(this);
    
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      this.connectStream(this.stream);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      this.processError();
    }
  }

  private connectStream(stream: MediaStream) {
    this.analyser = this.audioContext.createAnalyser();
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);
    this.analyser.smoothingTimeConstant = 0.5;
    this.analyser.fftSize = 32;

    this.initRenderLoop();
  }

  private initRenderLoop() {
    if (!this.analyser) return;
    
    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

    const renderFrame = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(frequencyData);
      this.processFrame(frequencyData);
      requestAnimationFrame(renderFrame);
    };
    
    requestAnimationFrame(renderFrame);
  }

  public cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.analyser) {
      this.analyser.disconnect();
    }
  }
}

const MicVisualizer: React.FC<MicVisualizerProps> = ({ className }) => {
  const mainRef = useRef<HTMLElement>(null);
  const visualElementsRef = useRef<HTMLDivElement[]>([]);
  const visualValueCount = 16;

  useEffect(() => {
    const createDOMElements = () => {
      if (!mainRef.current) return;
      mainRef.current.innerHTML = '';
      visualElementsRef.current = [];
      
      for (let i = 0; i < visualValueCount; ++i) {
        const elm = document.createElement('div');
        mainRef.current.appendChild(elm);
        visualElementsRef.current.push(elm);
      }
    };

    let visualizer: AudioVisualizer | null = null;

    const init = async () => {
      try {
        const audioContext = new AudioContext();
        createDOMElements();

        const dataMap = { 0: 15, 1: 10, 2: 8, 3: 9, 4: 6, 5: 5, 6: 2, 7: 1, 8: 0, 9: 4, 10: 3, 11: 7, 12: 11, 13: 12, 14: 13, 15: 14 };
        
        const processFrame = (data: Uint8Array) => {
          const values = Object.values(data);
          for (let i = 0; i < visualValueCount; ++i) {
            const value = values[dataMap[i as keyof typeof dataMap]] / 255;
            const elmStyles = visualElementsRef.current[i].style;
            elmStyles.transform = `scaleY(${value})`;
            elmStyles.opacity = Math.max(0.25, value).toString();
          }
        };

        const processError = () => {
          if (!mainRef.current) return;
          mainRef.current.classList.add(styles.error);
          mainRef.current.innerText = 'Please allow access to your microphone to see the visualization.';
        };

        visualizer = new AudioVisualizer(audioContext, processFrame, processError);
      } catch (error) {
        console.error("Error initializing audio visualizer:", error);
        if (mainRef.current) {
          mainRef.current.classList.add(styles.error);
          mainRef.current.innerText = 'Failed to initialize audio visualizer.';
        }
      }
    };

    init();

    return () => {
      if (visualizer) {
        visualizer.cleanup();
      }
      if (mainRef.current) {
        mainRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <main ref={mainRef} className={`${styles.main} ${className || ''}`} />
  );
};

export default MicVisualizer; 