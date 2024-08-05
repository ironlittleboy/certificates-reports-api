import { Router } from "express";
import { db } from "../db.js";
import bcrypt from "bcrypt";

const periodRouter = Router();

//ruta para guardar un periodo en la base de datos
periodRouter.post("/save-period", (req, res) => {
  const { periodo, fechainicio, fechafin } = req.body;
  const query =
    "INSERT INTO Periodo (Nombre_periodo, Fecha_inicio, Fecha_fin) VALUES (?, ?, ?)";

  db.query(query, [periodo, fechainicio, fechafin], (err, result) => {
    if (err) {
      console.error("Error al guardar el período:", err);
      return res.status(500).send("Error al guardar el período");
    }
    res.json({
      status: true,
      message: "Período guardado correctamente",
      data: result
    });
  });
});

// Ruta para obtener los períodos
periodRouter.get("/get-periodos", (req, res) => {
  const query = "SELECT * FROM Periodo";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener los períodos:", err);
      return res.status(500).send("Error al obtener los períodos");
    }
    res.json({
      status: true,
      message: "Períodos obtenidos correctamente",
      data: results,
    });
  });
});


periodRouter.delete('/delete-periodo', (req, res) => {
  const { id } = req.query;
  const query = `DELETE FROM Periodo WHERE Id_periodo = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar el periodo:', err);
      return res.status(500).json({
        status: false,
        message: 'Error al eliminar el periodo',
      });
    }
    res.json({
      status: true,
      message: 'Período eliminado correctamente',
    });
  });
});
export default periodRouter;