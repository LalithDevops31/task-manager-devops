import { useState, useEffect } from 'react'
import TaskList from './components/TaskList'
import './App.css'

const API = '/tasks'

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all tasks on mount
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch(API)
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      if (!res.ok) throw new Error('Failed to create task')
      const newTask = await res.json()
      setTasks(prev => [...prev, newTask])
      setTitle('')
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleTask = async (id, currentStatus) => {
    const newStatus = currentStatus === 'todo' ? 'done' : 'todo'
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update task')
      const updated = await res.json()
      setTasks(prev => prev.map(t => t.id === id ? updated : t))
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteTask = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Manager</h1>
        <p className="subtitle">A DevOps practice app</p>
      </header>

      <main className="app-main">
        <form className="task-form" onSubmit={createTask}>
          <input
            type="text"
            className="task-input"
            placeholder="What needs to be done?"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Add Task</button>
        </form>

        {error && <div className="error-banner">{error} <button onClick={() => setError(null)}>✕</button></div>}

        {loading ? (
          <p className="loading">Loading tasks...</p>
        ) : (
          <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />
        )}
      </main>
    </div>
  )
}

export default App
