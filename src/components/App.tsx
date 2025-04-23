// components/App.tsx - Main React component

import * as React from 'react';
import { useState, useEffect } from 'react';
import { NoteList } from './NoteList';
import { Editor } from './Editor';
import { App as ObsidianApp } from 'obsidian';

interface AppProps {
  app: ObsidianApp;
}

export const REACT_VIEW_TYPE = "react-view";

export const AppComponent: React.FC<AppProps> = ({ app }) => {
  const [notes, setNotes] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  
  // Example of loading data when component mounts
  useEffect(() => {
    app.vault.getMarkdownFiles().forEach((file) => {
      console.log(file.name);
      setNotes((prevNotes) => [...prevNotes, file.name]);
    });
  }, []);

  return (
    <div className="react-app">
      <h2 className="react-app-header">My React Obsidian Plugin</h2>
      
      <div className="react-app-container">
        <NoteList 
          notes={notes} 
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
        />
        
        <Editor selectedNote={selectedNote} />
      </div>
    </div>
  );
};
