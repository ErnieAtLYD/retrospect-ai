// components/App.tsx - Main React component

import * as React from 'react';
import { useState, useEffect } from 'react';
import { NoteList } from './NoteList';
import { Editor } from './Editor';
import { App as ObsidianApp } from 'obsidian';
import { NoteAnalysis } from '../types';

interface AppProps {
  app: ObsidianApp;
  content?: string;
  currentNoteId?: string;
  currentNoteName?: string;
  analysisHistory: NoteAnalysis[];
  onSelectNote: (noteId: string) => void;
}

export const REACT_VIEW_TYPE = "react-view";

export const AppComponent: React.FC<AppProps> = ({ app, content }) => {
  const [selectedNote, setSelectedNote] = useState<string | null>(currentNoteId || null);
  
  // Update selected note when currentNoteId changes
  useEffect(() => {
    if (currentNoteId) {
      setSelectedNote(currentNoteId);
    }
  }, [currentNoteId]);
  
  // Handle note selection
  const handleSelectNote = (noteId: string) => {
    setSelectedNote(noteId);
    onSelectNote(noteId);
  };

  console.log({content});

  return (
    <div className="react-app">
      <h2 className="react-app-header">AI Analysis</h2>
      
      <div className="react-app-container">
        <div className="react-app-sidebar">
          <NoteList 
            notes={analysisHistory.map(item => ({ id: item.noteId, name: item.noteName }))} 
            selectedNote={selectedNote} 
            onSelectNote={handleSelectNote} 
          />
        </div>
        
        <div className="react-app-content">
          {content ? (
            <div className="analysis-content">
              {currentNoteName && (
                <div className="analysis-header">
                  <h3>Analysis for: {currentNoteName}</h3>
                </div>
              )}
              <div className="analysis-text" dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          ) : (
            <div className="no-analysis">
              <p>No analysis available. Run an analysis on a note to see results here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
