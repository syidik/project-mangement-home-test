const mongoose = require("mongoose");
 
const TaskSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Draft', 'In Progress', 'Done'],
    default: 'Draft'
  },
  bobot: {
    type: Number,
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});
 
const TaskModel = mongoose.model("Task", TaskSchema);
module.exports = TaskModel;