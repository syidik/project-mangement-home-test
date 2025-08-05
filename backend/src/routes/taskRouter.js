const express = require("express");
const TaskModel = require("../models/tasks")
const ProjectModel = require("../models/projects")

const router = express.Router();
 
router.post("/tasks", async (req, res) => {
  try {
    const task = new TaskModel(req.body);
    
    await task.save();

    await CalculateProjectCompletion(task.project);

    res.status(201).send(task);
  } catch (error) {
    if (error.errors?.status?.kind === 'enum') {
      return res.status(400).send({
        error: `Status must be one of: ${error.errors.status.properties.enumValues.join(', ')}`
      });
    }
    res.status(500).send({ error: error.message });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const tasks = await TaskModel.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tasks/:id', async (req, res) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };

    const task = await TaskModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }    

    await CalculateProjectCompletion(task.project);

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    // 1. Delete the task
    const deletedTask = await TaskModel.findByIdAndDelete(req.params.id);
    
    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
  
    await CalculateProjectCompletion(deletedTask.project);
    
    res.json({ 
      message: 'Task deleted successfully',
      task: deletedTask
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete task',
      details: error.message 
    });
  }
});

async function CalculateProjectCompletion(projectId)
{
    const project = await ProjectModel.findById(projectId).populate("tasks");
    if (!project)
    {
      return res.status(404).json({ error: 'Project not found' });
    }
    const tasks = project.tasks ? project.tasks : [];

    if (tasks.length === 0) {
      project.status = "Draft";
      project.completion_progress = 0;
      await project.save();
      return project;
    }

    let totalWeight = 0;
    let completedWeight = 0;
    let allDraft = true;
    let anyInProgress = false;
    let allDone = true;

    tasks.forEach(task => {

      if (task.status !== 'Draft') {
        allDraft = false;
      }
      if (task.status === 'In Progress') {
         anyInProgress = true;
      }
      if (task.status !== 'Done') {
         allDone = false;
      }

      totalWeight += task.bobot;
      if (task.status === 'Done') {
        completedWeight += task.bobot;
      }
    });

    let projectStatus = project.status;
    if (allDone) {
      projectStatus = 'Done';
    } else if (anyInProgress) {
      projectStatus = 'In Progress';
    } else if (allDraft) {
      projectStatus = 'Draft';
    }
    const completionPercentage = totalWeight > 0 
      ? parseFloat(((completedWeight / totalWeight) * 100).toFixed(2))
      : 0;

    project.status = projectStatus;
    project.completion_progress = completionPercentage;
    await project.save();

    return project;
}
 
module.exports = router;