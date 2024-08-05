import { Router } from "express";
import { db } from "../db.js";

const semestreRouter = Router();

// ruta para guardar semestre
semestreRouter.post('/save-semestre', (req, res) => {
  const { nombre } = req.body;
  const query = `INSERT INTO semestre (Nombre) VALUES (?)`;
  db.query(query, [nombre], (err, result) => {
    if (err) {
      res.status(500).json({
        error: err.message,
        status: false,
        message: 'Error al guardar semestre'
      });
      return;
    }
    res.status(200).json({
      status: true,
      message: 'Semestre guardado correctamente'
    });
  });
})

// Ruta para obtener los semestres
semestreRouter.get('/get-semestres', (req, res) => {
  db.query('SELECT * FROM semestre', (error, results) => {
    if (error) {
      console.error('Error al obtener los semestres:', error);
      return res.status(500).send('Error al obtener los semestres');
    }
    res.json({
      status: true,
      message: 'Semestres obtenidos correctamente',
      data: results,
    });
  });
});

semestreRouter.delete('/delete-semestre', (req, res) => {
  const { id } = req.query;
  const query = `DELETE FROM semestre WHERE Id_semestre = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar el semestre:', err);
      return res.status(500).json({
        status: false,
        message: 'Error al eliminar el semestre',
      });
    }
    res.json({
      status: true,
      message: 'Semestre eliminado correctamente',
    });
  });
});

export default semestreRouter;