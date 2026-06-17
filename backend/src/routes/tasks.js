const express = require('express');
const router = express.Router();

let tasks = [];
let nextId = 1;

// GET /tasks - list all tasks
router.get('/', (req, res) => {
  res.json(tasks);
});

// GET /tasks/:id - get single task
router.get('/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// POST /tasks - create task
router.post('/', (req, res) => {
  const { title } = req.body;
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }
  const task = {
    id: nextId++,
    title: title.trim(),
    status: 'todo',
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  res.status(201).json(task);
});

// PUT /tasks/:id - update task
router.put('/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  const { title, status } = req.body;
  if (title) tasks[index].title = title.trim();
  if (status) tasks[index].status = status;
  tasks[index].updatedAt = new Date().toISOString();

  res.json(tasks[index]);
});

// DELETE /tasks/:id - delete task
router.delete('/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Task not found' });
  tasks.splice(index, 1);
  res.json({ success: true });
});

module.exports = router;
