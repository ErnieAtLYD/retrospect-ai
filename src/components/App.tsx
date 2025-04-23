// components/App.tsx - Main React component

import * as React from 'react';
import { useState, useEffect } from 'react';
import { NoteList } from './NoteList';
import { Editor } from './Editor';
import { App as ObsidianApp } from 'obsidian';

interface AppProps {
  app: ObsidianApp;
  content?: string;
}

export const REACT_VIEW_TYPE = "react-view";

export const AppComponent: React.FC<AppProps> = ({ app, content }) => {
  const [notes, setNotes] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  
  // Example of loading data when component mounts
  useEffect(() => {
    app.vault.getMarkdownFiles().forEach((file) => {
      console.log(file.name);
      setNotes((prevNotes) => [...prevNotes, file.name]);
    });
  }, []);

  console.log({content});

  return (
    <div className="react-app">
      <h2 className="react-app-header">AI Analysis</h2>
      
      <div className="react-app-container">
        {content ? (
          <div className="analysis-content">
            <div className="analysis-text" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        ) : (
          <div className="no-analysis">
            <p>No analysis available. Run an analysis on a note to see results here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
