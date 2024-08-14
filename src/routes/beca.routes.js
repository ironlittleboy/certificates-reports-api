import { Router } from "express";
import { db } from "../db.js";

const becaRouter = Router();


becaRouter.get("/beca-data/:studentId", (req, res) => {
  const { studentId } = req.params;

  db.query(`select * from estudiantes inner join certificado on estudiantes.Id_estudiante = certificado.Id_estudiante inner join certificado_beca on certificado.Id_certificado = certificado_beca.id_certificado WHERE estudiantes.Id_estudiante = ?`, [studentId], (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).json({
        error: "Error al consultar datos de la beca",
        status: false,
      });
    }
    return res.status(200).json({
      status: true,
      message: "Consulta exitosa",
      data: results[0],
    });
  });
});

becaRouter.get("/comprobate-beca/:studentId", (req, res) => {
  const { studentId } = req.params;
  db.query("select COUNT(*) as count from estudiantes inner join certificado on estudiantes.Id_estudiante = certificado.Id_estudiante inner join certificado_beca on certificado.Id_certificado = certificado_beca.id_certificado WHERE estudiantes.Id_estudiante = ?", [studentId], (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).json({
        error: "Error al consultar la existencia de la beca",
        status: false,
      });
    }
    // console.log(results[0].count);
    return res.status(200).json({
      status: true,
      data: results[0],
      becaExist: results[0].count > 0,
    });
  })
});

becaRouter.post("/save-beca/:studentId", (req, res) => {
  const { studentId } = req.params;
  const { tipoBeca, descripcionBeca, montoBeca, idPeriodo, fecha } = req.body;

  console.log({
    studentId,
    tipoBeca,
    descripcionBeca,
    montoBeca,
    idPeriodo,
    fecha,
  });

  const dataMysqlFormat = fecha.split("/").reverse().join("-");
  console.log(dataMysqlFormat);
  db.query(
    "INSERT INTO certificado (Tipo_certificado, Fecha_certificado, descripcion_certificado, Id_estudiante, Id_periodo) VALUES (?,?,?,?,?)",
    ["Certificado beca", dataMysqlFormat, descripcionBeca, studentId, idPeriodo],
    (error, results) => {
      if (error) {
        console.log(error);
        return res.status(500).json({
          error: "Error al guardar beca",
          status: false,
        });
      }

      const idCertificado = results.insertId;

      db.query(
        "INSERT INTO certificado_beca (id_certificado, Tipo_certificado_beca, Fecha_certificado_beca, monto_beca) VALUES (?, ?, ?, ?)",
        [idCertificado, tipoBeca, dataMysqlFormat, montoBeca],
        (error, results) => {
          if (error) {
            console.log(error);
            return res.status(500).json({
              error: "Error al guardar beca",
              status: false,
            });
          }
          return res.status(200).json({
            status: true,
            message: "Beca guardada exitosamente",
            data: results,
          });
        }
      );
    }
  );
});

export default becaRouter;
