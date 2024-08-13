import { Router } from "express";
import { db } from "../db.js";
import fs from "fs";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const reportRouter = Router();

reportRouter.get('/get-reports/:studentId', (req, res) => {
  const { studentId } = req.params;
  db.query('SELECT * FROM reportes where Id_estudiante = ?', [studentId], (error, results) => {
    if (error) {
      console.error('Error al consultar reportes:', error);
      return res.status(500).json({ error: 'Error al consultar reportes', status: false });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontraron reportes', status: false });
    }
    res.status(200).json({
       status: true, 
       message: 'Reportes consultados correctamente',
       data: results 
      });
  });
});

reportRouter.post("/generate-report/:type/:studentId", (req, res) => {
  // Obtener los parámetros de la solicitud
  const { type, studentId } = req.params;
  const { asunto, causaReporte } = req.body;
  const currentDate = new Date().toISOString().replace(/[:]/g, "-").split("T")[0];
  const randomNumerByDate = new Date().valueOf();
  
  
  db.query(
    "SELECT * FROM estudiantes join semestre on estudiantes.Id_semestre = semestre.Id_semestre join periodo on estudiantes.Id_periodo = periodo.Id_periodo WHERE Id_estudiante = ?",
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
      const fechaInicio = new Date(studentData.Fecha_inicio).toLocaleDateString();
      const fechaFin = new Date(studentData.Fecha_fin).toLocaleDateString();
      // Lógica para el reporte
      try {
        if (type === "reporte-general") {
          // Añadir contenido del reporte general
          doc.fontSize(15);
          const pageHeight = doc.page.height; // Obtener la altura de la página
          const textHeight = 200; // Ajusta según sea necesario
          const verticalPosition = (pageHeight - textHeight) / 2 - 100;
          const textMargin = 50;
          doc
            .fontSize(18)
            .text("Reporte General", { align: "center" })
            .moveDown(1);

          doc
            .fontSize(12)
            .text(
              "La suscrito Decanato de la Carrera de Tecnologías de la Información de la Facultad de Ciencias de la Vida y Tecnologías de la Universidad Laica Eloy Alfaro de Manabí.",
              textMargin,
              verticalPosition,
              { width: 450, align: "justify" }
            )
            .moveDown(1.5);

          doc.text("Asunto:", textMargin).moveDown(1);
          doc.text(asunto, textMargin, doc.y, { align: "justify" }).moveDown(1);
          doc.text("Informa", textMargin, doc.y, { align: "center" }).moveDown(1.5);

          doc
            .text(
              `Debido a su excelente desempeño académico, el/la estudiante ${studentData.Nombres} con C.I. ${studentData.Cedula} de la carrera ${studentData.Carrera} del ${studentData.Nombre_semestre}, por su destacada participación lo hace acreedor a reconocimiento, periodo académico ${studentData.Nombre_periodo}, ${fechaInicio} hasta ${fechaFin} ,con registro de matrícula ${studentData.CodigoMatricula}.`,
              textMargin,
              doc.y,
              { width: 450, align: "justify" }
            )
            .moveDown(2);

          doc.text("Lo Certifica,", textMargin).moveDown(1);
          doc.text("Lic. Dolores Muñoz Verduga, PhD.", textMargin).text(
            "Decana Facultad de Ciencias de la Vida y Tecnologías",
            textMargin
          ).moveDown(2);

          const today = new Date();
          doc.text(`Manta, ${today.toLocaleDateString()}`, textMargin);
        } else if (type === "reporte-conducta") {
          // Añadir contenido del reporte de conducta
          doc.fontSize(15).text("Reporte de Conducta", 50, 100);
          const pageHeight = doc.page.height;
          const textHeight = 200;
          const verticalPosition = (pageHeight - textHeight) / 2 - 100;
          const textMargin = 50;

          doc
            .fontSize(12)
            .text(
              "La suscrita asociación estudiantil de la Carrera de Tecnologías de la Información de la Facultad de Ciencias de la Vida y Tecnologías de la Universidad Laica Eloy Alfaro de Manabí.",
              textMargin,
              verticalPosition,
              { width: 450, align: "justify" }
            )
            .moveDown(1);

          doc.text("Asunto:", textMargin).moveDown(1);
          doc.text(asunto, textMargin, doc.y, { align: "justify" }).moveDown(1);
          doc.text("Reporta", { align: "center" }).moveDown(1);

          doc
            .text(
              `Que el/la señor/señorita ${studentData.Nombres} con C.I. ${studentData.Cedula}, del ${studentData.Nombre_semestre} de la carrera de Tecnologías de la Información, periodo académico ${studentData.Nombre_periodo}, ${fechaInicio} hasta ${fechaFin},con registro de matrícula ${studentData.CodigoMatricula}. Se ha involucrado en una acción sancionable.`,
              textMargin,
              doc.y,
              { width: 450, align: "justify" }
            )
            .moveDown(2);

          doc
            .text(
              "Estas actividades le han generado un reporte que estará presente en futuras observaciones.",
              textMargin,
              doc.y,
              { width: 450, align: "justify" }
            )
            .moveDown(2);

          doc.text("Lo Certifica,", { align: "center" }).moveDown(1);
          const today = new Date();
          doc.text("Asociación estudiantil", { align: "center" }).text(
            `Manta, ${today.toLocaleDateString()}`,
            { align: "center" }
          );
        } else {
          return res.status(404).json({
            error: "Tipo de reporte no encontrado",
            status: false,
          });
        }

        // Agregar imagen al certificado
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

        // Crear el directorio para el reporte
        const folderPath = path.join(__dirname, `../../upload/reporte/${studentData.Nombres.replace(/\s/g, "")}_${studentData.Id_estudiante}`);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        // Guardar el reporte en el servidor
        const fileName = `reporte_${type}_${studentId}_${currentDate}_${randomNumerByDate}.pdf`;
        const pdfPath = path.join(folderPath, fileName);
        const writeStream = fs.createWriteStream(pdfPath);

        // Manejar el evento de finalización
        writeStream.on('finish', () => {
          res.setHeader("Content-Type", "application/json");
          return res.status(200).json({
            status: true,
            message: "Reporte generado correctamente",
            filePath: pdfPath,
            fileName: fileName,
            downloadLink: `/upload/reporte/${studentData.Nombres.replace(/\s/g, "")}_${studentData.Id_estudiante}/${encodeURIComponent(fileName)}`
          });
        });
        const downloadLink = `/upload/reporte/${studentData.Nombres.replace(/\s/g, "")}_${studentData.Id_estudiante}/${encodeURIComponent(fileName)}`;
        // Manejar errores de escritura
        writeStream.on('error', (err) => {
          console.error("Error al guardar el archivo PDF:", err);
          res.status(500).json({
            error: "Error al guardar el archivo PDF",
            status: false
          });
        });

        doc.pipe(writeStream);    
        doc.end();

        // Insertar en la tabla de reportes
        db.query(
          "INSERT into reportes (`Descripcion_reporte`, `Fecha_reporte`, `Causa_reporte`, `Id_estudiante`, `Id_periodo`, `filePathReporte`, `fileNameReporte`, `tipo_reporte`) values (?, ?, ?, ?, ?, ?, ?, ?);",
          [
            asunto,
            currentDate,
            causaReporte,
            studentId,
            studentData.Id_periodo,
            downloadLink,
            fileName,
            type
          ],
          (error, results) => {
            if (error) {
              console.error("Error al insertar el reporte en la base de datos:", error);
              return res.status(500).json({
                error: "Error al insertar el reporte en la base de datos",
                status: false,
              });
            }
            console.log("Reporte insertado correctamente en la base de datos");
            console.log(results);
          }
        );

      } catch (error) {
        console.error("Error al generar el reporte:", error);
        res.status(500).json({
          error: "Error al generar el reporte",
          status: false,
        });
      }
    }
  );
});



reportRouter.get("/download-pdf/:studentId/:fileName", (req, res) => {
  const { fileName, studentId } = req.params;
  db.query("SELECT * from reportes join estudiantes on estudiantes.`Id_estudiante` = reportes.`Id_estudiante` WHERE estudiantes.`Id_estudiante` = ? and reportes.fileNameReporte = ?", [studentId, fileName], (error, results) => {
    if (error) {
      console.error("Error al consultar reporte:", error);
      return res.status(500).json({
        error: "Error al consultar reporte",
        status: false,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: "Reporte no encontrado",
        status: false,
      });
    }

    // console.log(results[0]);
    const studentData = results[0];
    const filePath = path.join(__dirname, `../../upload/reporte/${studentData.Nombres.replace(/\s/g, "")}_${studentData.Id_estudiante}`, fileName);
    // console.log(filePath);
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

export default reportRouter;
