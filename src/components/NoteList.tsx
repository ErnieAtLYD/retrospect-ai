import * as React from 'react';

interface Note {
  id: string;
  name: string;
}

interface NoteListProps {
  notes: Note[];
  selectedNote: string | null;
  onSelectNote: (noteId: string) => void;
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
        {notes.length > 0 ? (
          notes.map((note) => (
            <li 
              key={note.id}
              className={note.id === selectedNote ? 'selected' : ''}
              onClick={() => onSelectNote(note.id)}
            >
              {note.name}
            </li>
          ))
        ) : (
          <li className="empty-list">No analyzed notes yet</li>
        )}
      </ul>
    </div>
  );
};
