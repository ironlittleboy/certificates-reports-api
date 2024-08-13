import { Router } from "express";
import { db } from "../db.js";
import bcrypt from "bcrypt";
import xlsx from "xlsx";
import multer from "multer";
import { handleCreateEstudiante, 
  handleFilterStudentsByPeriod, 
  handleGetStudentById, 
  handleGetStudents, 
  handleSaveCharge, 
  handleStudentByPracticeState, 
  searchStudent 
} from "../controllers/student.controller.js";

const studentsRouter = Router();
/* const storage = multer.memoryStorage(); // almacenamiento en memoria para facilitar la lectura del archivo
const upload = multer({ storage });
 */
// ruta para guardar estudiante
studentsRouter.post("/save-student", handleCreateEstudiante);

// Ruta para obtener los estudiantes de un periodo
studentsRouter.get("/students-by-periodo", handleFilterStudentsByPeriod);

// Ruta para manejar la búsqueda de estudiantes
studentsRouter.get("/search", searchStudent);

// Ruta para obtener todos los estudiantes
studentsRouter.get("/all-students", handleGetStudents);

// Ruta para obeneter estudiante por id
studentsRouter.get("/get-student/:id", handleGetStudentById);

// Ruta para manejar la carga masiva de datos de estudiantes desde un archivo Excel (XLSX)
studentsRouter.post("/save-charge", handleSaveCharge);
studentsRouter.get("/student-by-practica/:practicaState", handleStudentByPracticeState);

export default studentsRouter;
