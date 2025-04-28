// components/Editor.tsx - Editor component example
import * as React from 'react';

interface EditorProps {
  selectedNote: string | null;
}

export const Editor: React.FC<EditorProps> = ({ selectedNote }) => {
  if (!selectedNote) {
    return <div className="editor-empty">Select a note to edit</div>;
  }

  return (
    <div className="editor">
      <h3>Editing: {selectedNote}</h3>
      <textarea 
        className="editor-textarea"
        defaultValue={`This is the content of ${selectedNote}`}
      />
    </div>
  );
};