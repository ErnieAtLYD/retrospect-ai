import * as React from 'react';

interface NoteListProps {
  notes: string[];
  selectedNote: string | null;
  onSelectNote: (note: string) => void;
}

export const NoteList: React.FC<NoteListProps> = ({ 
  notes, 
  selectedNote, 
  onSelectNote 
}) => {
  return (
    <div className="note-list">
      <h3>Your Notes</h3>
      <ul>
        {notes.map((note) => (
          <li 
            key={note}
            className={note === selectedNote ? 'selected' : ''}
            onClick={() => onSelectNote(note)}
          >
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
};
