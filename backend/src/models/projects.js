const mongoose = require("mongoose");
 
const ProjectSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Draft', 'In Progress', 'Done'],
    default: 'Draft'
  },
  completion_progress: {
    type: mongoose.Types.Decimal128,
    required: true,
    get: (v) => v ? parseFloat(v.toString()) : null, // Remove toFixed() to return number
    set: (v) => mongoose.Types.Decimal128.fromString(parseFloat(v).toFixed(2))
  },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

ProjectSchema.set('toJSON', { getters: true }); 
ProjectSchema.virtual('tasks', {
  ref: 'Task',          // The model to use
  localField: '_id',     // Find tasks where `project` field matches this _id
  foreignField: 'project' 
});

const ProjectModel = mongoose.model("Project", ProjectSchema);
module.exports = ProjectModel;