import React, { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export const TodoListTool: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', text: 'Bahas Bab 4', completed: true },
    { id: '2', text: 'Latihan Soal Matematika', completed: false },
    { id: '3', text: 'Tugas Kelompok', completed: false },
  ]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now().toString(), text: input.trim(), completed: false }]);
      setInput('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      <div className="p-4 bg-white border-b border-slate-100 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Tambah tugas baru..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-blue-500"
        />
        <button onClick={addTodo} className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-xl shadow-md hover:bg-blue-700 active:scale-95 transition-all">
          <Plus size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar space-y-2">
        {todos.map(todo => (
          <div key={todo.id} className={`flex items-center gap-3 p-3 rounded-xl border bg-white shadow-sm transition-all group ${todo.completed ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
            <button 
              onClick={() => toggleTodo(todo.id)}
              className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors shrink-0 ${todo.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-blue-500'}`}
            >
              {todo.completed && <Check size={14} strokeWidth={3} />}
            </button>
            <span className={`text-sm font-bold flex-1 ${todo.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {todos.length === 0 && (
          <div className="text-center text-slate-400 text-sm font-bold mt-10">Belum ada tugas.</div>
        )}
      </div>
    </div>
  );
};
