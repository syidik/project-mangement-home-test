const express = require("express");
const mongoose = require("mongoose");
const ProjectModel = require("../models/projects")
const TaskModel = require("../models/tasks")

const router = express.Router();
 
router.post("/projects", async (req, res) => {
  try {
    const project = new ProjectModel(req.body);
    
    await project.save();
    res.status(201).send(project);
  } catch (error) {
    if (error.errors?.status?.kind === 'enum') {
      return res.status(400).send({
        error: `Status must be one of: ${error.errors.status.properties.enumValues.join(', ')}`
      });
    }
    res.status(500).send({ error: error.message });
  }
});

router.get('/projects', async (req, res) => {
  try {
    const projects = await ProjectModel.find({})
      .populate('tasks');
      
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/projects/:id', async (req, res) => {
  try {
    const project = await ProjectModel.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };

    const project = await ProjectModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      await TaskModel.deleteMany({ project: req.params.id }).session(session);
      const deletedProject = await ProjectModel.findByIdAndDelete(
        req.params.id,
        { session }
      );
      
      if (!deletedProject) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Project not found' });
      }
      
      await session.commitTransaction();
      res.json({ 
        message: 'Project and all associated tasks deleted successfully',
        project: deletedProject
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete project',
      details: error.message 
    });
  }
});
 
module.exports = router;