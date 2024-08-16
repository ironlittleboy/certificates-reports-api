import { db } from "../db.js";
import xlsx from "xlsx";
import multer from "multer";

const storage = multer.memoryStorage(); // almacenamiento en memoria para facilitar la lectura del archivo
const upload = multer({ storage });

export const handleCreateEstudiante = (req, res) => {
  const { name, cedula, email, carrera, semestre, periodo, codigomatricula } =
    req.body;

  if (cedula.length !== 10) {
    console.log("La cédula debe tener 10 dígitos.");
    return res.status(400).json({
      error: "La cédula debe tener 10 dígitos.",
      status: false,
    });
  }
  // se verifica que el codigo de matricula no exista en la base de datos
  db.query(
    "SELECT * FROM estudiantes WHERE CodigoMatricula = ?",
    [codigomatricula],
    (error, results) => {
      if (error) {
        console.error("Error al verificar el código de matrícula:", error);
        return res.status(500).json({
          error: "Error al verificar el código de matrícula",
          status: false,
        });
      }
      if (results.length > 0) {
        console.log(
          "Ya existe un estudiante con el código de matrícula proporcionado: ",
          results[0].CodigoMatricula
        );
        return res.status(400).json({
          error:
            "Ya existe un estudiante con el código de matrícula proporcionado: " +
            results[0].CodigoMatricula,
          status: false,
        });
      }

      // se verifica que la cedula no exista en la base de datos, con respecto al periodo
      db.query(
        "SELECT * FROM estudiantes join periodo on estudiantes.Id_periodo = periodo.Id_periodo WHERE Cedula = ? AND estudiantes.Id_periodo = ?",
        [cedula, periodo],
        (error, results) => {
          if (error) {
            console.error("Error al verificar la cédula:", error);
            return res.status(500).json({
              error: "Error al verificar la cédula",
              status: false,
            });
          }
          // console.log(results);
          if (results.length > 0) {
            console.log(
              "Ya existe un estudiante con la cédula proporcionada en el periodo seleccionado: ",
              results[0].Nombre_periodo
            );
            return res.status(400).json({
              error:
                "Ya existe un estudiante con la cédula proporcionada en el periodo seleccionado: " +
                results[0].Nombre_periodo,
              status: false,
            });
          }

          db.query(
            `INSERT INTO estudiantes (Nombres, Cedula, email, Carrera, Id_Semestre, Id_periodo, CodigoMatricula) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
              const insertedId = result.insertId;
              console.log(result);
              return res.status(200).json({
                status: true,
                message: "Estudiante guardado correctamente",
              });
            }
          );
        }
      );
    }
  );
};

export const handleFilterStudentsByPeriod = (req, res) => {
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
};

export const searchStudent = (req, res) => {
  const { filter, value } = req.query;
  console.log(filter, value);
  // Verifica el tipo de búsqueda (cedula o nombre) y ajusta la consulta SQL
  let sqlQuery = "";
  let sqlParams = [];
  if (filter === "cedula") {
    if (value === "all") {
      return db.query(
        "SELECT * FROM estudiantes join periodo on estudiantes.Id_periodo = periodo.Id_periodo join semestre on estudiantes.Id_semestre = semestre.Id_semestre",
        (error, results) => {
          if (error) {
            console.error("Error al obtener los estudiantes:", error);
            return res.status(500).json({
              error: "Error al obtener los estudiantes",
              status: false,
            });
          }
          res.json({
            status: true,
            message: "Estudiantes obtenidos correctamente",
            data: results,
          });
        }
      );
    }
    sqlQuery =
      "SELECT * FROM estudiantes  join periodo on estudiantes.Id_periodo = periodo.Id_periodo join semestre on estudiantes.Id_semestre = semestre.Id_semestre WHERE Cedula LIKE ?";
    sqlParams = [`%${value}%`];

    // Ejecuta la consulta con el término de búsqueda proporcionado
    db.query(sqlQuery, sqlParams, (error, results) => {
      if (error) {
        console.error("Error en la búsqueda:", error);
        return res.status(500).json({
          error: "Error en la búsqueda",
          status: false,
        });
      }
      res.json({
        status: true,
        message: "Búsqueda realizada correctamente",
        data: results,
      });
    });
  } else if (filter === "name") {
    sqlQuery =
      "SELECT * FROM estudiantes join periodo on estudiantes.Id_periodo = periodo.Id_periodo join semestre on estudiantes.Id_semestre = semestre.Id_semestre WHERE Nombres LIKE ?";
    sqlParams = [`%${value}%`];

    // Ejecuta la consulta con el término de búsqueda proporcionado
    db.query(sqlQuery, sqlParams, (error, results) => {
      if (error) {
        console.error("Error en la búsqueda:", error);
        return res.status(500).json({
          error: "Error en la búsqueda",
          status: false,
        });
      }
      res.json({
        status: true,
        message: "Búsqueda realizada correctamente",
        data: results,
      });
    });
  } else {
    return res.status(400).json({
      error: "Tipo de búsqueda no válido. Debe ser 'cedula' o 'nombre'.",
      status: false,
    });
  }
  /* 
  // Ejecuta la consulta con el término de búsqueda proporcionado
  db.query(sqlQuery, sqlParams, (error, results) => {
    if (error) {
      console.error("Error en la búsqueda:", error);
      return res.status(500).json({
        error: "Error en la búsqueda",
        status: false,
      });
    } 
    res.json({
      status: true,
      message: "Búsqueda realizada correctamente",
      data: results,
    });
    
  }); */
};

export const handleGetStudentById = (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT * FROM estudiantes  join periodo on estudiantes.Id_periodo = periodo.Id_periodo join semestre on estudiantes.Id_semestre = semestre.Id_semestre WHERE Id_estudiante = ?",
    [id],
    (error, results) => {
      if (error) {
        console.error("Error al obtener el estudiante:", error);
        return res.status(500).send("Error al obtener el estudiante");
      }
      db.query("select count(*) as count from reportes where Id_estudiante = ?", [id], (error, result) => {
        if (error) {
          console.error("Error al obtener el estudiante:", error);
          return res.status(500).send("Error al obtener el estudiante");
        }
        results[0].count = result[0].count;
        // console.log(results[0]);
        res.json({
          status: true,
          message: "Estudiante obtenido correctamente",
          data: results[0],
          hasReport: results[0].count > 0
        });

      });

    }
  );
};

export const handleStudentByPracticeState = (req, res) => {
  let { practicaState } = req.params;
  let query =
    "SELECT * from estudiantes join semestre on estudiantes.`Id_semestre` = semestre.`Id_semestre` join periodo on estudiantes.`Id_periodo` = periodo.`Id_periodo` WHERE estudiantes.certificado_practicas = ?";

  if (practicaState === "practicas") {
    practicaState = 1;
    return db.query(query, [practicaState], (error, results) => {
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
    });
  }

  if (practicaState === "no-practicas") {
    practicaState = 0;

    return db.query(query, [practicaState], (error, results) => {
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
    });
  }

  if (practicaState === "all") {
    query =
      "SELECT * from estudiantes join semestre on estudiantes.`Id_semestre` = semestre.`Id_semestre` join periodo on estudiantes.`Id_periodo` = periodo.`Id_periodo`;";
    return db.query(query, (error, results) => {
      if (error) {
        console.error("Error al obtener los estudiantes:", error);
        return res
          .status(500)
          .json({ error: "Error al obtener los estudiantes" });
      }
      res.json({
        status: true,
        message: "Estudiantes obtenidos correctamente",
        data: results,
      });
    });
  }
};

export const handleGetStudents = (req, res) => {
  db.query(
    "select * from estudiantes join periodo on estudiantes.Id_periodo = periodo.Id_periodo join semestre on estudiantes.Id_semestre = semestre.Id_semestre;",
    (error, results) => {
      if (error) {
        console.error("Error al obtener los estudiantes:", error);
        res.status(500).json({ error: "Error al obtener los estudiantes" });
      } else {
        // console.log(results);
        res.json({
          status: true,
          message: "Estudiantes obtenidos correctamente",
          data: results,
        });
      }
    }
  );
};

export const handleSaveCharge = (req, res) => {
  const { data } = req.query;
  console.log(data);
  // console.log(req.files);
  if (!req.files || !req.files.file) {
    return res.status(400).json({
      status: false,
      message: "No se ha proporcionado ningún archivo.",
    });
  }

  const file = req.files.file;
  // console.log(file);
  try {
    const workbook = xlsx.read(file.data, { type: "buffer" });
    // console.log(workbook);
    const sheet_name_list = workbook.SheetNames[0];
    // console.log(sheet_name_list);
    // const worksheet = workbook.Sheets[sheet_name_list];
    const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list]);
    console.log(xlData);
    if (xlData.length === 0) {
      console.log("El archivo no contiene datos.");
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
        Email,
        Id_semestre,
        Id_periodo,
        CodigoMatricula,
        certificado_practicas,
      } = row;
      const sql =
        "INSERT INTO estudiantes (Nombres, Cedula, Carrera, Email, Id_semestre, Id_periodo, CodigoMatricula, certificado_practicas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      const values = [
        Nombres,
        Cedula,
        Carrera,
        Email,
        Id_semestre,
        Id_periodo,
        CodigoMatricula,
        certificado_practicas,
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
};
