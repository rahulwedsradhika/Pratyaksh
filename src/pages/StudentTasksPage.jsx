import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Plus, Trash2, ListTodo, Check } from 'lucide-react';
import TaskCompletion from '../components/TaskCompletion';
import StudentAppShell from '../components/shell/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';
import { studentFetch } from '../services/studentFetch';
import { useAuth } from '../context/AuthContext';
import '../styles/simpleStudentTasks.css';

const categories = ['Reading', 'Lecture', 'Revision', 'Test', 'Other'];
export default function StudentTasksPage() {
  const { user } = useAuth();
  const owner = user?.id || user?._id;
  const ownerRef = useRef(owner); ownerRef.current = owner;
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Reading');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingTask, setPendingTask] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  async function request(path = '', method = 'GET', body) {
    const response = await studentFetch(`/api/student/tasks${path}`, {
      method, cache: 'no-store', headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const data = await response.json();
    if (!response.ok || !data.status) throw new Error(data.message || 'Unable to save your tasks. Please try again.');
    return data.data;
  }
  useEffect(() => {
    let active = true;
    setTasks([]); setLoading(true); setError(''); setTitle('');
    if (!owner) { setLoading(false); return; }
    request().then(data => { if (active) setTasks(data); })
      .catch(error => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [owner, retry]);
  async function mutate(work) {
    if (busy || !owner) return;
    const currentOwner = owner;
    setBusy(true); setError('');
    try { await work(currentOwner); }
    catch (error) { if (ownerRef.current === currentOwner) setError(error.message); }
    finally { setBusy(false); }
  }
  function add(event) {
    event.preventDefault();
    if (!title.trim()) return;
    mutate(async currentOwner => {
      const task = await request('', 'POST', { title: title.trim(), category, priority: 'Medium', dueDate: '', notes: '', done: false });
      if (ownerRef.current !== currentOwner) return;
      setTasks(previous => [task, ...previous]); setTitle('');
    });
  }
  function toggle(task) {
    setPendingTask(task.id);
    mutate(async currentOwner => {
      const updated = await request(`/${task.id}`, 'PATCH', { ...task, done: !task.done });
      if (ownerRef.current === currentOwner) setTasks(previous => previous.map(item => item.id === task.id ? updated : item));
    }).finally(() => setPendingTask(null));
  }
  function remove(task) {
    mutate(async currentOwner => {
      await request(`/${task.id}`, 'DELETE');
      if (ownerRef.current === currentOwner) setTasks(previous => previous.filter(item => item.id !== task.id));
    });
  }
  function clearCompleted() {
    mutate(async currentOwner => {
      for (const task of tasks.filter(item => item.done)) {
        if (ownerRef.current !== currentOwner) return;
        await request(`/${task.id}`, 'DELETE');
        if (ownerRef.current === currentOwner) setTasks(previous => previous.filter(item => item.id !== task.id));
      }
    });
  }
  const completed = tasks.filter(task => task.done).length;
  return <StudentAppShell><PageContainer maxWidth="860px"><div className="simple-study-tasks">
    <header className="simple-task-heading mb-4">
      <span className="editorial-badge editorial-badge-terracotta mb-2"><CheckSquare size={13} /> Study Planner</span>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div><h1>My Tasks &amp; Study Targets</h1><p>Manage your daily Samhita reading targets, lecture checkpoints, and self-study goals.</p></div>
        {tasks.length > 0 && <TaskCompletion completed={completed} total={tasks.length} />}
      </div>
    </header>
    {error && <div role="alert" className="editorial-card p-3 mb-3">{error} <button type="button" className="simple-task-text-button" disabled={busy} onClick={() => setRetry(value => value + 1)}>Reload tasks</button></div>}
    <section className="editorial-card simple-task-composer p-4 mb-4">
      <h2><span className="simple-task-section-icon"><Plus size={17}/></span>Add a study target</h2>
      <form onSubmit={add}><fieldset className="simple-task-add" disabled={busy || loading || !owner}>
        <input aria-label="Task title" className="form-control" required maxLength={200} placeholder="e.g. Read Charaka Sutra Ch 1, shlokas 15 to 30…" value={title} onChange={event => setTitle(event.target.value)} />
        <select aria-label="Task category" className="form-select" value={category} onChange={event => setCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select>
        <button className="editorial-btn editorial-btn-primary" type="submit"><Plus size={17} />{busy ? 'Saving…' : 'Add'}</button>
      </fieldset></form>
    </section>
    {loading ? <p role="status" className="text-center p-4">Loading your tasks…</p> : tasks.length ? <section className="editorial-card simple-task-checklist p-4">
      <div className="d-flex justify-content-between align-items-center mb-3 gap-3"><div><h2 className="mb-1">Your checklist <span className="simple-task-count">{tasks.length}</span></h2><p className="simple-task-checklist-hint" role="status">{pendingTask ? 'Saving your progress…' : completed === tasks.length ? 'A little effort, a real achievement. Well done.' : 'Small targets. Steady progress.'}</p></div>{completed > 0 && <button type="button" className="simple-task-text-button" disabled={busy} onClick={clearCompleted}>Clear completed</button>}</div>
      <div className="d-flex flex-column gap-2">{tasks.map(task => <div className={`simple-task-row ${task.done ? 'is-done' : ''} ${pendingTask === task.id ? 'is-saving' : ''}`} aria-busy={pendingTask === task.id} key={task.id}>
        <label className="simple-task-label"><span className="simple-task-checkbox"><input type="checkbox" aria-label={`Mark ${task.title} ${task.done ? 'incomplete' : 'complete'}`} checked={task.done} disabled={busy} onChange={() => toggle(task)} /><span className="simple-task-check-mark" aria-hidden="true"><Check size={17} strokeWidth={2.5}/></span></span><span className="simple-task-copy"><span className="simple-task-title">{task.title}</span><span className="simple-task-category">{task.category}{task.done && <span className="simple-task-done-label"> · Completed</span>}</span></span></label>
        <button type="button" disabled={busy} aria-label={`Delete ${task.title}`} className="simple-task-delete" onClick={() => remove(task)}><Trash2 size={16} /></button>
      </div>)}</div>
    </section> : !error && <section className="editorial-card text-center p-5"><div className="simple-task-empty-icon"><ListTodo size={25} /></div><h2>No study tasks on your checklist</h2><p className="mb-0">Use the form above to add your daily Samhita readings, lecture checkpoints, or study goals to keep yourself on track.</p></section>}
  </div></PageContainer></StudentAppShell>;
}
