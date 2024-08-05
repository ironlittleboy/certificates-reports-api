import { Router } from "express";
import { db } from "../db.js";
import fs, { stat } from "fs";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const certificatesRotuer = Router();


// Ruta para generar y descargar un certificado en PDF con datos dinámicos
certificatesRotuer.post("/generate-certificado/:id", (req, res) => {
  const { certificadoType } = req.body;
  const studentId = req.params.id;

  // Consultar la base de datos para obtener los datos del estudiante
  db.query(
    "SELECT * FROM estudiantes join semestre on estudiantes.Id_semestre = semestre.Id_semestre join periodo on estudiantes.Id_periodo = periodo.Id_periodo WHERE Id_estudiante = ?",
    [studentId],
    (error, results) => {
      if (error) {
        console.error("Error al consultar datos del estudiante:", error);
        return res.status(500).json({
          error: "Error interno del servidor al consultar datos del estudiante",
          status: false
        });
      }

      if (results.length === 0) {
        return res.status(404).json({ 
          error: "Estudiante no encontrado",
          status: false 
        });
      }

      const studentData = results[0];

      // Iniciar el documento PDF
      const doc = new PDFDocument();

      // Configurar encabezados, fuentes, estilos, etc.
      doc.font("Times-Roman");

      // Agregar contenido específico al certificado
      if (certificadoType === "certificado-conducta") {
        // Obtener la altura de la página
        const pageHeight = doc.page.height;

        // Definir la altura del texto y centrarlo verticalmente
        const textHeight = 100; // Ajusta según sea necesario

        // Calcular la posición vertical centrada
        const verticalPosition = (pageHeight - textHeight) / 2;

        // Escribir el texto utilizando la posición vertical calculada
        doc
          .fontSize(15)
          .text("Certificado de Conducta", 50, verticalPosition)
          .text(
            `Este certificado es otorgado a ${studentData.Nombres} con C.I. ${studentData.Cedula}, estudiante de la carrera de ${studentData.Carrera} en la facultad "Ciencias de la vida y la tecnología" por su excelente conducta en la Universidad.`,
            50,
            verticalPosition + 50
          );
      } else if (certificadoType === "certificado-practicas") {
        // Obtener la altura de la página
        const pageHeight = doc.page.height;
        const textHeight = 200; // Ajusta según sea necesario
        const verticalPosition = (pageHeight - textHeight) / 2;
        const textMargin = 50; // Margen desde el borde
        const lineHeight = 15; // Altura de cada línea

        // Escribir el texto utilizando la posición vertical calculada
        // Configurar el título
        doc
          .fontSize(15)
          .text("Certificado de Prácticas", { align: "center" })
          .moveDown(1); // Espaciado después del título

        // Texto principal
        doc
          .fontSize(12)
          .text(
            "La suscrita secretaria de la Carrera de Tecnologías de la Información de la Facultad de Ciencias de la Vida y Tecnologías de la Universidad Laica Eloy Alfaro de Manabí.",
            textMargin,
            verticalPosition,
            { width: 450, align: "justify" }
          )
          .moveDown(2); // Espaciado después del primer bloque

        // Texto "CERTIFICA"
        doc.fontSize(12).text("CERTIFICA", { align: "center" }).moveDown(2); // Espaciado después de "CERTIFICA"

        // Segundo bloque de texto
        doc
          .text(
            `Que revisado los registros del Sistema de Gestión Académica SGA, el señor ${
              studentData.Nombres
            } con C.I. ${studentData.Cedula}, consta matriculado en el ${
              studentData.Semestre
            } NIVEL de la carrera de ${
              studentData.Carrera
            }, periodo académico ${studentData.Nombre_periodo},${studentData.fecha_inicio} hasta ${studentData.fecha_fin}, con registro de matrícula ${studentData.CodigoMatricula}. El peticionario puede hacer uso de la presente para trámites universitarios de becas.`,
            textMargin,
            doc.y,
            { width: 450, align: "justify" }
          )
          .moveDown(2); // Espaciado después del segundo bloque

        // Texto "Lo Certifica,"
        doc.text("Lo Certifica,", { align: "center" }).moveDown(2); // Espaciado después de "Lo Certifica,"

        // Texto final
        doc
          .text("Ing. María Elena Garcia Vélez", { align: "center" })
          .text("Secretaria Carrera de Tecnologías de la Información", {
            align: "center",
          })
          .text(`Manta, ${new Date().toLocaleDateString()}`, {
            align: "center",
          });
      } else if (certificadoType === "certificado-matricula") {
        // Obtener la altura de la página
        const pageHeight = doc.page.height;
        const textHeight = 200; // Ajusta según sea necesario
        const verticalPosition = (pageHeight - textHeight) / 2;
        const textMargin = 50; // Margen desde el borde
        const lineHeight = 15; // Altura de cada línea

        // Configurar el título
        doc
          .fontSize(15)
          .text("Certificado de Matrícula", { align: "center" })
          .moveDown(1); // Espaciado después del título

        // Texto principal

        // formatear fecha
        const fecha_inicio = new Date(studentData.Fecha_inicio).toLocaleDateString();
        const fecha_fin = new Date(studentData.Fecha_fin).toLocaleDateString();
        console.log(fecha_inicio, fecha_fin);
        doc
          .fontSize(12)
          .text("Certificado otorgado a:", { align: "center" })
          .moveDown(1) // Espaciado después del texto "Certificado otorgado a:"
          .text(studentData.Nombres, { align: "center" })
          .moveDown(2) // Espaciado después del nombre
          .text(
            `Que revisado los  registros  del  Sistema de Gestión Académica SGA, el/la señor/señorita ${studentData.Nombres.toUpperCase()}  con C.I. ${studentData.Cedula},  consta matriculado  en el ${studentData.Nombre_semestre} NIVEL de la carrera de ${studentData.Carrera}, periodo académico ${studentData.Nombre_periodo} con registro de matrícula ${studentData.CodigoMatricula}, mismo que inició ${fecha_inicio} y culmina el ${fecha_fin}.`,
            textMargin,
            doc.y,
            { width: 450, align: "justify" }
          )
          .moveDown(2) // Espaciado después del texto principal
          .text(`Manta, ${new Date().toLocaleDateString()}`, {
            align: "center",
          })
          .moveDown(2); // Espaciado después de la fecha

        // Texto final
        doc
          .text("Lic. Dolores Muñoz Verduga, PhD.", { align: "center" })
          .text(
            "Decana de la Facultad de Ciencias de la Vida y la Tecnología",
            { align: "center" }
          )
          .moveDown(1)
          .text("Ing. Elsa Hiraida Santana, Mg.", { align: "center" })
          .text(
            "Responsable de la Comisión de Prácticas Preprofesionales Carreras de Ingeniería en Sistemas y Tecnologías de la Información",
            { align: "center" }
          );
      }

      // Agregar imagen al certificado
      const imagePath1 = path.join(__dirname, "../../images", "imagen-1.png");
      const imagePath2 = path.join(__dirname, "../../images", "imagen-2.jpeg");
      const imagePath3 = path.join(__dirname, "../../images", "imagen-3.jpeg");
      // console.log(imagePath1, imagePath2, imagePath3);
      
      // Ajusta la posición y tamaño de cada imagen según sea necesario
      try {
        if (fs.existsSync(imagePath1)) {
          // Imagen 1 en la parte superior izquierda
          doc.image(imagePath1, 50, 50, { width: 150 });
        } else {
          console.warn(
            `La imagen 'imagen-1.png' no se encontró en el directorio 'images'.`
          );
        }

        if (fs.existsSync(imagePath2)) {
          // Imagen 2 en la parte superior derecha
          doc.image(imagePath2, 400, 50, { width: 150 });
        } else {
          console.warn(
            `La imagen 'imagen-2.jpeg' no se encontró en el directorio 'images'.`
          );
        }

        if (fs.existsSync(imagePath3)) {
          // Imagen 3 en la parte inferior izquierda
          doc.image(imagePath3, 50, 700, { width: 150 });
        } else {
          console.warn(
            `La imagen 'imagen-3.jpeg' no se encontró en el directorio 'images'.`
          );
        }
      } catch (err) {
        console.error("Error al cargar las imágenes:", err);
      }

      // Finalizar y descargar el PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=${certificadoType}_${new Date().getTime()}_${studentData.Cedula}.pdf`
      );
      doc.pipe(res);
      doc.end();

      // insertar en la tabla de certificados de la base de datos, siempre que nomas sean practicas
      if (certificadoType === "certificado-practicas") {
        db.query(
          "INSERT INTO certificados (Id_estudiante, Id_tipo_certificado, fecha_emision) VALUES (?, ?, ?)",
          [studentId, 1, new Date()],
          (error, results) => {
            if (error) {
              console.error("Error al insertar certificado en la base de datos:", error);
            }
            console.log("Certificado insertado correctamente en la base de datos.");
            console.log(results);
          }
        );
      }
    }
  );
});

export default certificatesRotuer;
