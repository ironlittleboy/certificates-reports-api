import { Router } from "express";
import { db } from "../db.js";
import bcrypt from "bcrypt";
import xlsx from "xlsx";
import multer from "multer";

const studentsRouter = Router();
const storage = multer.memoryStorage(); // almacenamiento en memoria para facilitar la lectura del archivo
const upload = multer({ storage });

// ruta para guardar estudiante
studentsRouter.post("/save-student", (req, res) => {
  const { name, cedula, email, carrera, semestre, periodo, codigomatricula } =
    req.body;
  const query = `INSERT INTO estudiantes (Nombres, Cedula, email, Carrera, Id_Semestre, Id_periodo, CodigoMatricula) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    query,
    [name, cedula, email, carrera, semestre, periodo, codigomatricula],
    (err, result) => {
      if (err) {
        console.error("Error al guardar estudiante:", err);
        res.status(500).json({
          error: err.message,
          status: false,
          message: "Error al guardar estudiante",
        });
        return;
      }
      res.status(200).json({
        status: true,
        message: "Estudiante guardado correctamente",
      });
    }
  );
});

// Ruta para obtener los estudiantes de un periodo
studentsRouter.get("/students-by-periodo", (req, res) => {
  const { periodo } = req.query;
  // console.log(periodo);

  if (periodo === "all") {
    db.query(
      "SELECT * FROM estudiantes join periodo on estudiantes.Id_periodo = periodo.Id_periodo join semestre on estudiantes.Id_semestre = semestre.Id_semestre",
      (error, results) => {
        if (error) {
          console.error("Error al obtener los estudiantes:", error);
          return res.status(500).send("Error al obtener los estudiantes");
        }
        return res.json({
          status: true,
          message: "Estudiantes obtenidos correctamente",
          data: results,
        });
      }
    );
  } else {
    db.query(
      "select * from estudiantes join tesis.Periodo P on estudiantes.Id_periodo = P.Id_periodo join semestre on estudiantes.Id_semestre = semestre.Id_semestre where P.Id_periodo = ?",
      [periodo],
      (error, results) => {
        if (error) {
          console.error("Error al obtener los estudiantes:", error);
          return res.status(500).send("Error al obtener los estudiantes");
        }
        res.json({
          status: true,
          message: "Estudiantes obtenidos correctamente",
          data: results,
        });
      }
    );
  }
});

// Ruta para manejar la búsqueda de estudiantes
studentsRouter.get("/search", (req, res) => {
  const { filter, value } = req.query;
  console.log(filter, value);
  // Verifica el tipo de búsqueda (cedula o nombre) y ajusta la consulta SQL
  let sqlQuery = "";
  let sqlParams = [];
  if (filter === "cedula") {
    if (value === "") {
      db.query("SELECT * FROM estudiantes join periodo on estudiantes.Id_periodo = periodo.Id_periodo join semestre on estudiantes.Id_semestre = semestre.Id_semestre", (error, results) => {
        if (error) {
          console.error("Error al obtener los estudiantes:", error);
          return res.status(500).json({
            error: "Error al obtener los estudiantes",
            status: false,
          });
        }
        return res.json({
          status: true,
          message: "Estudiantes obtenidos correctamente",
          data: results,
        });
      });
    }
    sqlQuery = "SELECT * FROM estudiantes WHERE Cedula = ?";
    sqlParams = [value];
  } else if (filter === "name") {
    sqlQuery =
      "SELECT * FROM estudiantes join periodo on estudiantes.Id_periodo = periodo.Id_periodo join semestre on estudiantes.Id_semestre = semestre.Id_semestre WHERE Nombres LIKE ?";
    sqlParams = [`%${value}%`];
  } else {
    return res.status(400).json({
      error: "Tipo de búsqueda no válido. Debe ser 'cedula' o 'nombre'.",
      status: false,
    });
  }

  // Ejecuta la consulta con el término de búsqueda proporcionado
  db.query(sqlQuery, sqlParams, (error, results) => {
    if (error) {
      console.error("Error en la búsqueda:", error);
      res.status(500).json({
        error: "Error en la búsqueda",
        status: false,
      });
    } else {
      res.json({
        status: true,
        message: "Búsqueda realizada correctamente",
        data: results,
      });
    }
  });
});

// Ruta para obtener todos los estudiantes
studentsRouter.get("/all-students", (req, res) => {
  db.query(
    "select * from estudiantes join periodo on estudiantes.Id_periodo = periodo.Id_periodo join semestre on estudiantes.Id_semestre = semestre.Id_semestre;",
    (error, results) => {
      if (error) {
        console.error("Error al obtener los estudiantes:", error);
        res.status(500).json({ error: "Error al obtener los estudiantes" });
      } else {
        res.json({
          status: true,
          message: "Estudiantes obtenidos correctamente",
          data: results,
        });
      }
    }
  );
});

// Ruta para obeneter estudiante por id
studentsRouter.get("/get-student/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT * FROM estudiantes  join periodo on estudiantes.Id_periodo = periodo.Id_periodo join semestre on estudiantes.Id_semestre = semestre.Id_semestre WHERE Id_estudiante = ?",
    [id],
    (error, results) => {
      if (error) {
        console.error("Error al obtener el estudiante:", error);
        return res.status(500).send("Error al obtener el estudiante");
      }
      res.json({
        status: true,
        message: "Estudiante obtenido correctamente",
        data: results[0],
      });
    }
  );
});

// Ruta para manejar la carga masiva de datos de estudiantes desde un archivo Excel (XLSX)
studentsRouter.post("/save-charge", (req, res) => {
  const { data } = req.query;
  console.log(data);
  console.log(req.files);
  if (!req.files || !req.files.file) {
    return res.status(400).json({
      status: false,
      message: "No se ha proporcionado ningún archivo.",
    });
  }

  const file = req.files.file;

  try {
    const workbook = xlsx.read(file.data, { type: "buffer" });
    const sheet_name_list = workbook.SheetNames;
    const xlData = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheet_name_list[0]]
    );

    if (xlData.length === 0) {
      return res.status(400).json({
        status: false,
        message: "El archivo no contiene datos.",
      });
    }

    // Crear un arreglo para almacenar las promesas de cada inserción
    const insertPromises = xlData.map((row) => {
      const {
        Nombres,
        Cedula,
        Carrera,
        email,
        Semestre,
        Id_periodo,
        CodigoMatricula,
      } = row;
      const sql =
        "INSERT INTO estudiantes (Nombres, Cedula, Carrera, email, Semestre, Id_periodo, CodigoMatricula) VALUES (?, ?, ?, ?, ?, ?, ?)";
      const values = [
        Nombres,
        Cedula,
        Carrera,
        email,
        Semestre,
        Id_periodo,
        CodigoMatricula,
      ];
      return new Promise((resolve, reject) => {
        db.query(sql, values, (error, results) => {
          if (error) {
            console.error("Error al insertar datos:", error);
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
    });

    // Ejecutar todas las inserciones en paralelo
    Promise.all(insertPromises)
      .then(() => {
        res.json({
          status: true,
          message: "Datos cargados correctamente.",
        });
      })
      .catch((error) => {
        console.error("Error al cargar datos:", error);
        res.status(500).json({
          status: false,
          message:
            "Error al cargar los datos. Algunos registros pueden haber fallado.",
        });
      });
  } catch (error) {
    console.error("Error al procesar el archivo Excel:", error);
    res.status(500).json({
      status: false,
      message: "Error al procesar el archivo Excel.",
    });
  }
});

export default studentsRouter;
