import React, { useState } from 'react';
import { Intro } from './components/Intro';
import { ARView } from './components/ARView';
import { AboutModal } from './components/AboutModal';
import { AppMode } from './types';

function App() {
  const [mode, setMode] = useState<AppMode>('intro');
  const [showAbout, setShowAbout] = useState(false);

  const handleStart = () => {
    setMode('scanner');
  };

  const handleBack = () => {
    setMode('intro');
  };

  return (
    <div className="w-full h-full min-h-screen bg-black">
      {mode === 'intro' && (
        <Intro 
          onStart={handleStart} 
          onAbout={() => setShowAbout(true)} 
        />
      )}
      
      {mode === 'scanner' && (
        <ARView onBack={handleBack} />
      )}

      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
}

export default App;