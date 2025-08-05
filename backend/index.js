const express = require("express");
const cors = require('cors'); 
const connectDB = require ("./server/db/conn");
const ProjectRouter = require('./src/routes/projectRouter.js')
const TaskRouter = require('./src/routes/taskRouter.js')

const app = express();
const PORT = 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// app.options('*', cors());
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", ProjectRouter);
app.use("/api", TaskRouter);

connectDB();  
 
app.get("/", (request, response) => {
  response.send({ message: "Hello from an Express API!" });
});
 
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});