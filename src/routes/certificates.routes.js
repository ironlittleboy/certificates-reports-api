import { Router } from "express";
import { db } from "../db.js";
import fs, { stat } from "fs";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const certificatesRotuer = Router();

// Ruta para generar y descargar un certificado en PDF con datos dinámicos
certificatesRotuer.post("/generate-certificado/:id", (req, res) => {
  const { certificadoType, nivelPracticas } = req.body; // nivelPracticas es correpodiente a practicas laborales I o II
  const studentId = req.params.id;
  console.log({
    certificadoType,
    studentId,
    nivelPracticas,
  })
  // Consultar la base de datos para obtener los datos del estudiante
  db.query(
    "SELECT estudiantes.*, semestre.*, periodo.*, practicas.Lugar_de_practicas, practicas.Tutor_practicas, practicas.Estado_practicas, practicas.Tipo_de_practicas FROM estudiantes join semestre on estudiantes.Id_semestre = semestre.Id_semestre join periodo on estudiantes.Id_periodo = periodo.Id_periodo left join practicas on estudiantes.Id_estudiante = practicas.Id_estudiante WHERE estudiantes.Id_estudiante = ?",
    [studentId],
    (error, results) => {
      if (error) {
        console.error("Error al consultar datos del estudiante:", error);
        return res.status(500).json({
          message:
            "Error interno del servidor al consultar datos del estudiante",
          status: false,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Estudiante no encontrado",
          status: false,
        });
      }

      const studentData = results[0];
      // console.log(studentData);
      // Iniciar el documento PDF
      const doc = new PDFDocument();
      console.log("Generando certificado:", certificadoType);
      console.log(studentData);
      // Configurar encabezados, fuentes, estilos, etc.
      doc.font("Helvetica");

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
          )
          .moveDown(1);

        doc
          .fontSize(12)
          .text(`Manta, ${new Date().toLocaleDateString()}`, {
            align: "right",
          })
          .moveDown(2);
        doc
          .text("Ing. María Elena García Vélez.", { align: "center" })
          .text("Secretaria carrera de Tecnologías de la Información", {
            align: "center",
          })
          .moveDown(1);
      } else if (certificadoType === "certificado-practicas") {
        // Verificar si el estudiante tiene prácticas registradas
        /* if (studentData.Id_practicas === null) {
          console.log("Estudiante no tiene practicas registradas");
          return res.status(404).json({
            error: "Estudiante no tiene practicas registradas",
            status: false,
          });
        } */
        // Obtener la altura de la página
        const pageHeight = doc.page.height;
        const textHeight = 200; // Ajusta según sea necesario
        const verticalPosition = (pageHeight - textHeight) / 2;
        const textMargin = 50; // Margen desde el borde
        const lineHeight = 15; // Altura de cada línea
        const columnWidth = (doc.page.width - textMargin * 2) / 2; // Ancho de la columna

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
        doc.fontSize(12).text("Otorgado a:", { align: "center" }).moveDown(1); // Espaciado después de "CERTIFICA"
        doc
          .font("Helvetica-Bold")
          .fontSize(20)
          .text(studentData.Nombres, { align: "center" })
          .moveDown(1); // Espaciado después del nombre

        // Segundo bloque de texto
        doc
          .fontSize(12)
          .font("Helvetica")
          .text(
            "Por haber culminado satisfactoriamente las ",
            textMargin,
            doc.y,
            { width: 450, align: "justify", continued: true }
          );
        doc.font("Helvetica-Bold").text("180 horas ", { continued: true });
        doc
          .font("Helvetica")
          .fontSize(12)
          .text("de Practicas Preprofesionales correspondientes a ", {
            continued: true,
          });
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .text(`"${nivelPracticas === '1' ? "Practicas preprofesionales I" : "Practicas preprofesionales II"}" (${studentData.Nombre_semestre}) "`, {
            continued: true,
          });
        doc
          .font("Helvetica")
          .fontSize(12)
          .text("realizadas en ", { continued: true });
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .text(
            studentData.Lugar_de_practicas
              ? studentData.Lugar_de_practicas + " "
              : "'No establecido'",
            { continued: true }
          );

        doc
          .fontSize(12)
          .font("Helvetica")
          .text("y supervisadas por el/la Ing. ", { continued: true });

        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .text(
            studentData.Tutor_practicas
              ? studentData.Tutor_practicas + " "
              : "'No establecido'",
            { continued: true }
          );
        doc
          .fontSize(12)
          .font("Helvetica")
          .text(`, en el periodo ${studentData.Nombre_periodo}.`, {
            continued: true,
          })
          .moveDown(1); // Espaciado después del segundo bloque

        doc
          .fontSize(12)
          .text(`Manta, ${new Date().toLocaleDateString()}`, { align: "right" })
          .moveDown(2); // Espaciado después de la fecha
        // Texto "Lo Certifica,"
        /*         doc.text("Lo Certifica,", { align: "center" }).moveDown(2); // Espaciado después de "Lo Certifica,"
         */
        // Texto final
        doc.text(
          "NG. Hiraida Monserrate Santana Cedeño, MG.",
          textMargin,
          doc.y,
          { align: "center" }
        );

        /*  doc
          .font("Helvetica")
          .text(studentData.Tutor_practicas ? studentData.Tutor_practicas : "No definido", textMargin + columnWidth - 90, doc.y, {
          align: "center", width: columnWidth
        }); */
        doc
          .font("Helvetica-Bold")
          .text(
            "Responsable de la Comisión de Prácticas Preprofesionales Carreras de Tecnologías de la Información",
            textMargin,
            doc.y,
            {
              align: "center",
            }
          );
        /*   doc
          .font("Helvetica-Bold")
          .text("Tutor de Prácticas", textMargin + columnWidth - 45, doc.y, {
            align: "center", width: columnWidth
          }); */

        // acutalizar el campo certificado_practica en la tabla estudaintes
        db.query(
          "UPDATE estudiantes SET certificado_practicas = 1 WHERE Id_estudiante = ?",
          [studentId],
          (error, results) => {
            if (error) {
              console.error(
                "Error al actualizar campo 'certificado_practicas' en la base de datos:",
                error
              );
            }
            console.log(
              "Campo 'certificado_practicas' actualizado correctamente en la base de datos."
            );
            // console.log(results);
          }
        );
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
        const fecha_inicio = new Date(
          studentData.Fecha_inicio
        ).toLocaleDateString();
        const fecha_fin = new Date(studentData.Fecha_fin).toLocaleDateString();
        console.log(fecha_inicio, fecha_fin);
        doc
          .fontSize(12)
          .text("Certificado otorgado a:", { align: "center" })
          .moveDown(1) // Espaciado después del texto "Certificado otorgado a:"
          .text(studentData.Nombres, { align: "center" })
          .moveDown(2) // Espaciado después del nombre
          .text(
            `Que revisado los  registros  del  Sistema de Gestión Académica SGA, el/la señor/señorita ${studentData.Nombres.toUpperCase()}  con C.I. ${
              studentData.Cedula
            },  consta matriculado  en el ${
              studentData.Nombre_semestre
            } NIVEL de la carrera de ${
              studentData.Carrera
            }, periodo académico ${
              studentData.Nombre_periodo
            } con registro de matrícula ${
              studentData.CodigoMatricula
            }, mismo que inició ${fecha_inicio} y culmina el ${fecha_fin}.`,
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
          .text("Ing. María Elena García Vélez.", { align: "center" })
          .text("Secretaria carrera de Tecnologías de la Información", {
            align: "center",
          })
          .moveDown(1);
        /* .text("Ing. Elsa Hiraida Santana, Mg.", { align: "center" })
          .text(
            "Responsable de la Comisión de Prácticas Preprofesionales Carreras de Ingeniería en Sistemas y Tecnologías de la Información",
            { align: "center" }
          ); */
      } else if (certificadoType === "certificado-beca") {
        console.log("generando certificado de beca");
        return db.query(`select * from estudiantes 
          inner join semestre on estudiantes.Id_semestre = semestre.Id_semestre
          inner join periodo on estudiantes.Id_periodo = periodo.Id_periodo
          inner join certificado on estudiantes.Id_estudiante = certificado.Id_estudiante 
          inner join certificado_beca on certificado.Id_certificado = certificado_beca.id_certificado WHERE estudiantes.Id_estudiante = ?`,
          [studentId],
          (error, results) => {
            if (error) {
              console.log(error);
              return res.status(500).json({
                error: "Error al consultar la existencia de la beca",
                status: false,
              });
            }
            console.log(results);
            const studentData = results[0];
            const doc = new PDFDocument();
            // Obtener la altura de la página
            const pageHeight = doc.page.height;
            const textHeight = 200; // Ajusta según sea necesario
            const verticalPosition = (pageHeight - textHeight) / 2;
            const textMargin = 50; // Margen desde el borde

            // Configurar el título
            doc
              .fontSize(15)
              .text("Certificado de Beca", { align: "center" })
              .moveDown(1); // Espaciado después del título

            // text principal
            doc
              .fontSize(12)
              .text("Certificado otorgado a:", { align: "center" })
              .moveDown(1);

            doc
              .fontSize(20)
              .text(studentData.Nombres, { align: "center" })
              .moveDown(1);
            doc
              .fontSize(12)
              .text(
                `Certificamos que el estudiante ${studentData.Nombres.toUpperCase()}, con número de cédula ${studentData.Cedula}, ha sido aprobado para recibir una beca de ${studentData.Tipo_certificado_beca}, con un monto total de ${studentData.monto_beca}.`,
                textMargin,
                verticalPosition,
                { width: 450, align: "justify" }
              )
              .moveDown(1); // Espaciado después del texto principal

            doc
              .fontSize(12)
              .text(
                `Esta beca ha sido concedida para el período académico ${studentData.Nombre_semestre} y tiene como objetivo ${studentData.descripcion_certificado}.`,
                textMargin,
                doc.y,
                { width: 450, align: "justify" }
              )
              .moveDown(1); // Espaciado después del texto principal

            doc
              .fontSize(12)
              .text(`Fecha de emsion, ${new Date(studentData.Fecha_certificado_beca).toLocaleDateString()}`, {
                align: "left",
              })
              .moveDown(1); // Espaciado después de la fecha

            // Texto final
            doc
              .text(
                "Se le recuerda al estudiante que debe cumplir con las condiciones establecidas para la concesión de esta beca para asegurar su renovación y mantenimiento.",
                textMargin,
                doc.y,
                { width: 450, align: "justify" }
              )
              .moveDown(2);
            
            doc.fontSize(12).font("Helvetica-Bold").text(`Ing, Armando Gilberto Franco Pico Mg.`, { align: "center" })
            // Agregar imagen al certificado
            const imagePath1 = path.join(
              __dirname,
              "../../images",
              "imagen-1.png"
            );
            const imagePath2 = path.join(
              __dirname,
              "../../images",
              "imagen-2.jpeg"
            );
            const imagePath3 = path.join(
              __dirname,
              "../../images",
              "imagen-3.jpeg"
            );
            const imageQR = path.join(__dirname, "../../images", "qr-code.png");
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
              if (fs.existsSync(imageQR)) {
                // Imagen QR en el centro inferior de la página
                doc.image(imageQR, 250, 580, {
                  fit: [100, 100],
                  align: "center", // Optional: Align the image horizontally
                  valign: "center", // Optional: Align the image vertically
                });
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
              `inline; filename=${certificadoType}_${new Date().getTime()}_${
                studentData.Cedula
              }.pdf`
            );
            doc.pipe(res);
            doc.end();
          }
        );
      }
      // Agregar imagen al certificado
      const imagePath1 = path.join(__dirname, "../../images", "imagen-1.png");
      const imagePath2 = path.join(__dirname, "../../images", "imagen-2.jpeg");
      const imagePath3 = path.join(__dirname, "../../images", "imagen-3.jpeg");
      const imageQR = path.join(__dirname, "../../images", "qr-code.png");
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
        if (fs.existsSync(imageQR)) {
          // Imagen QR en el centro inferior de la página
          doc.image(imageQR, 250, 580, {
            fit: [100, 100],
            align: "center", // Optional: Align the image horizontally
            valign: "center", // Optional: Align the image vertically
          });
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
      // Guardar el certificado en la base de datos
      if (certificadoType !== "certificado-beca") {
        console.log("El tipo de certificado no es de beca");
        db.query(
          "INSERT INTO certificado (Tipo_certificado, Fecha_certificado, descripcion_certificado, Id_estudiante, Id_periodo) VALUES (?, ?, ?, ?, ?)",
          [
            certificadoType,
            new Date(),
            "Certificado generado",
            studentId,
            studentData.Id_periodo,
          ],
          (error, results) => {
            if (error) {
              console.error(
                "Error al insertar certificado en la base de datos:",
                error
              );
            }
            console.log(
              "Certificado insertado correctamente en la base de datos."
            );
            console.log(results);
          }
        );
      }
      // Finalizar y descargar el PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=${certificadoType}_${new Date().getTime()}_${
          studentData.Cedula
        }.pdf`
      );
      doc.pipe(res);
      doc.end();
    }
  );
});

export default certificatesRotuer;
