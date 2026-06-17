function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return <p className="empty-state">No tasks yet. Add one above!</p>
  }

  const todo = tasks.filter(t => t.status === 'todo')
  const done = tasks.filter(t => t.status === 'done')

  return (
    <div className="task-list">
      <div className="task-section">
        <h2 className="section-title">To Do <span className="count">{todo.length}</span></h2>
        {todo.map(task => (
          <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>

      {done.length > 0 && (
        <div className="task-section">
          <h2 className="section-title done-title">Done <span className="count">{done.length}</span></h2>
          {done.map(task => (
            <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div className={`task-item ${task.status === 'done' ? 'task-done' : ''}`}>
      <input
        type="checkbox"
        checked={task.status === 'done'}
        onChange={() => onToggle(task.id, task.status)}
        className="task-checkbox"
      />
      <span className="task-title">{task.title}</span>
      <span className="task-meta">#{task.id}</span>
      <button
        className="btn btn-danger"
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
      >
        Delete
      </button>
    </div>
  )
}

export default TaskList
