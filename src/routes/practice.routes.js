import { Router } from "express";
import { db } from "../db.js";
const practiceRouter = Router();

practiceRouter.get("/practices/:studentId", (req, res) => {
  const { studentId } = req.params;
  db.query("SELECT * FROM practicas WHERE Id_estudiante = ?", [studentId], (error, result) => {
    if (error) {
      console.log(error);
      return res.status(500).json({
        message: "Error al obtener las prácticas",
        status: false
      });
    }
    return res.status(200).json({
      message: "Prácticas obtenidas correctamente",
      data: result,
      status: true
    });
  });
});  

practiceRouter.post("/save-practice/:studentId", (req, res) => {
  const { studentId } = req.params;
  const { estadoPracticas, fechaFinalPracticas, fechaInicioPracticas, docentePracticas, tipoPracticas, lugarPracticas, idPeriodo, nivelPracticas } = req.body;
  console.log({
    estadoPracticas, 
    fechaInicioPracticas, 
    fechaFinalPracticas,
    docentePracticas, 
    tipoPracticas, 
    lugarPracticas, 
    idPeriodo: parseInt(idPeriodo), 
    studentId: parseInt(studentId),
    nivelPracticas: parseInt(nivelPracticas)
  });
  // Validar que los campos no estén vacíos
  if (!estadoPracticas || !fechaInicioPracticas || !fechaFinalPracticas || !docentePracticas || !tipoPracticas || !lugarPracticas || !idPeriodo) {
    return res.status(400).json({
      message: "Todos los campos son requeridos",
      error: "Bad Request", 
      status: false 
    });
  }

  db.query("INSERT INTO practicas (Estado_practicas, Fecha_practicas, Tutor_practicas, Tipo_de_practicas, Lugar_de_practicas, Id_estudiante, Id_periodo, nivel_practicas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [estadoPracticas, fechaInicioPracticas, docentePracticas, tipoPracticas, lugarPracticas, studentId, idPeriodo, nivelPracticas], (error, result) => {
    if (error) {
      console.log(error);
      return res.status(500).json({
        message: "Error al guardar la práctica",
        status: false
      });
    }
    console.log(result);
    db.query("UPDATE estudiantes SET certificado_practicas = 1 WHERE Id_estudiante = ?", [studentId], (error, result) => {
      if (error) {
        console.log(error);
        return res.status(500).json({
          message: "Error al actualizar el estado del estudiante",
          status: false
        });
      }
    });
    return res.status(201).json({
      message: "Práctica guardada correctamente",
      status: true
    });
  });
});

export default practiceRouter;