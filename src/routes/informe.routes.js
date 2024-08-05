import { Router } from "express";
import { db } from "../db.js";
import fs from "fs";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const informeRouter = Router();

informeRouter.post("/generate-informe/:tipoInforme/:studentId", (req, res) => {
  const { studentId, tipoInforme } = req.params;
  const { tituloInforme, contenidoInforme } = req.body;
  let setTipoInforme = "";
  const currentDate = new Date().toISOString().replace(/[:]/g, "-").split("T")[0];
  const randomNumerByDate = new Date().valueOf();

  if (tipoInforme === "merito-investigativo") {
    setTipoInforme = "Mérito Investigativo";
  } else if (tipoInforme === "alto-rendimiento-academico") {
    setTipoInforme = "Alto Rendimiento Académico";
  } else if (tipoInforme === "alto-rendimiento-deportivo") {
    setTipoInforme = "Alto Rendimiento Deportivo";
  } else if (tipoInforme === "merito-cultural") {
    setTipoInforme = "Mérito Cultural";
  } else {
    return res.status(400).json({ error: "Tipo de informe no válido", status: false });
  }

  db.query(
    "SELECT * FROM estudiantes JOIN semestre ON estudiantes.Id_semestre = semestre.Id_semestre JOIN periodo ON estudiantes.Id_periodo = periodo.Id_periodo WHERE Id_estudiante = ?",
    [studentId],
    (error, results) => {
      if (error) {
        console.error("Error al consultar datos del estudiante:", error);
        return res.status(500).json({
          error: "Error interno del servidor al consultar datos del estudiante",
          status: false,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          error: "Estudiante no encontrado",
          status: false,
        });
      }

      const studentData = results[0];
      const doc = new PDFDocument();

      // Lógica para el informe
      try {
        doc.fontSize(15);

        const pageHeight = doc.page.height;
        const textHeight = 200;
        const verticalPosition = (pageHeight - textHeight) / 2 - 100;
        const textMargin = 50;
        const lineHeight = 15;
        doc.moveDown(2);
        doc.fontSize(18).text(`Informe ${tituloInforme}`, { align: "center" }).moveDown(1);

        doc.fontSize(12)
          .text(
            "La suscrito Decanato de la Carrera de Tecnologías de la Información de la Facultad de Ciencias de la Vida y Tecnologías de la Universidad Laica Eloy Alfaro de Manabí.",
            textMargin,
            verticalPosition,
            { width: 450, align: "justify" }
          )
          .moveDown(1.5);

        doc.fontSize(15).text("Informa:", textMargin, doc.y, { width: 450, align: "left" }).moveDown(1.5);

        const fechaInicio = new Date(studentData.fecha_inicio).toLocaleDateString();
        const fechaFin = new Date(studentData.fecha_fin).toLocaleDateString();
        doc.fontSize(12)
          .text(
            `Debido a su ${setTipoInforme}, el/la estudiante ${studentData.Nombres} con C.I. ${studentData.Cedula}, de la carrera de ${studentData.Carrera}, en el periodo vigente ${studentData.Nombre_periodo}, desde ${fechaInicio} hasta ${fechaFin}, por su ${setTipoInforme} lo hace acreedor a reconocimiento por parte de la institución.`
          )
          .moveDown(1.5);

        doc.text(contenidoInforme, textMargin, doc.y, { align: "justify" }).moveDown(1);

        doc.text("Lo Certifica,", textMargin).moveDown(1);

        doc.text("Lic. Dolores Muñoz Verduga, PhD.", textMargin)
          .text("Decana Facultad de Ciencias de la Vida y Tecnologías", textMargin)
          .moveDown(2);

        const today = new Date();
        doc.text(`Manta, ${today.toLocaleDateString()}`, textMargin);

        // Agregar imagen al informe
        const imagePath1 = path.join(__dirname, "../../images", "imagen-1.png");
        const imagePath2 = path.join(__dirname, "../../images", "imagen-2.jpeg");
        const imagePath3 = path.join(__dirname, "../../images", "imagen-3.jpeg");

        if (fs.existsSync(imagePath1)) {
          doc.image(imagePath1, 50, 50, { width: 150 });
        } else {
          console.warn(`La imagen 'imagen-1.png' no se encontró en el directorio 'images'.`);
        }

        if (fs.existsSync(imagePath2)) {
          doc.image(imagePath2, 400, 50, { width: 150 });
        } else {
          console.warn(`La imagen 'imagen-2.jpeg' no se encontró en el directorio 'images'.`);
        }

        if (fs.existsSync(imagePath3)) {
          doc.image(imagePath3, 50, 700, { width: 150 });
        } else {
          console.warn(`La imagen 'imagen-3.jpeg' no se encontró en el directorio 'images'.`);
        }

        // Crear el directorio para el informe
        const folderPath = path.join(__dirname, `../../upload/informe/${studentData.Nombres.replace(/\s/g, "")}_${studentData.Id_estudiante}`);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        const fileName = `informe_${tipoInforme}_${studentData.Cedula}_${currentDate}_${randomNumerByDate}.pdf`;
        const pdfPath = path.join(folderPath, fileName);

        // Guardar el informe en el servidor
        const writeStream = fs.createWriteStream(pdfPath);

        writeStream.on('finish', () => {
          res.setHeader("Content-Type", "application/json");
          res.status(200).json({
            status: true,
            message: "Informe generado correctamente",
            filePath: `/upload/informe/${studentData.Nombres.replace(/\s/g, "")}_${studentData.Id_estudiante}/${fileName}`,
            fileName: fileName,
            downloadLink: `/download-pdf/${encodeURIComponent(fileName)}`
          });
        });
        const downloadLink = `/download-pdf/${encodeURIComponent(fileName)}`;
        writeStream.on('error', (err) => {
          console.error("Error al guardar el archivo PDF:", err);
          res.status(500).json({
            error: "Error al guardar el archivo PDF",
            status: false
          });
        });

        doc.pipe(writeStream);
        doc.end();

        // Guardar el informe en la base de datos
        db.query(
          "INSERT INTO informes (Tipo_de_informe, Descripcion_informe, Fecha_informe, Id_estudiante, Id_periodo, filePathInforme, fileNameInforme) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            tipoInforme,
            contenidoInforme,
            currentDate,
            studentId,
            studentData.Id_periodo,
            downloadLink,
            fileName
          ], (error, results) => {
            if (error) {
              console.error("Error al guardar el informe en la base de datos:", error);
              return res.status(500).json({
                error: "Error al guardar el informe en la base de datos",
                status: false,
              });
            }
            console.log("Informe insertado correctamente en la base de datos");
          }
        );

      } catch (error) {
        console.error("Error al generar el informe:", error);
        res.status(500).json({
          error: "Error al generar el informe",
          status: false,
        });
      }
    }
  );
});


informeRouter.get('/download-pdf/:studentId/:fileName', (req, res) => {
  const { fileName, studentId } = req.params;
  db.query("SELECT * from informes join estudiantes on estudiantes.`Id_estudiante` = informes.`Id_estudiante` WHERE estudiantes.`Id_estudiante` = ? and informes.fileNameInforme = ?", [studentId, fileName], (error, results) => {  
    if (error) {
      console.error("Error al consultar informe:", error);
      return res.status(500).json({
        error: "Error al consultar informe",
        status: false
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: "Informe no encontrado",
        status: false
      });
    }
    console.log(results[0]);
    const studentData = results[0];
    const filePath = path.join(__dirname, `../../upload/informe/${studentData.Nombres.replace(/\s/g, "")}_${studentData.Id_estudiante}`, fileName);
    console.log(filePath);
    // Verificar si el archivo existe
    if (fs.existsSync(filePath)) {
      // Enviar el archivo para su descarga
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Error al enviar el archivo:', err);
          res.status(500).json({ error: 'Error al enviar el archivo', status: false });
        }
      });
    } else {
      res.status(404).json({ error: 'Archivo no encontrado', status: false });
    } 
  }); 
});


export default informeRouter;
