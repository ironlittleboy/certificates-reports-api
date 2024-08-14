import express from 'express';
import authRouter from './routes/auth.routes.js';
import periodoRouter from './routes/periodo.routes.js';
import studentsRouter from './routes/students.routes.js';
import semestreRouter from './routes/semestre.routes.js';
import practiceRouter from './routes/practice.routes.js';
import { config } from 'dotenv';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import morgan from 'morgan';
import cors from 'cors';
import reportRouter from './routes/report.routes.js';
import certificatesRotuer from './routes/certificates.routes.js';
import informeRouter from './routes/informe.routes.js';
import becaRouter from './routes/beca.routes.js';
const app = express();
config();

// Middleware para manejar tipo de contenido JSON y URLEncoded
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Middleware para rutas de autentificacion
app.use('/auth',authRouter);
// Middleware para manejar archivos subidos
app.use(fileUpload());



//Middleware de funciones prncipales
app.use('/api/estudiante', studentsRouter);
app.use('/api/periodo', periodoRouter);
app.use('/api/semestre', semestreRouter);
app.use('/api/report', reportRouter);
app.use('/api/certificado', certificatesRotuer);
app.use('/api/informe', informeRouter);
app.use('/api/practice', practiceRouter);
app.use('/api/beca', becaRouter);
// Middleware para manejar sesiones
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

// Hello World :D
/* app.get('/', (req, res) => {
  res.send('Hello World');
});
 */
/* app.get('/pdf', (req, res) => {
  doc.pipe(fs.createWriteStream('upload/informe/output.pdf'));
  doc.fontSize(25).text('Hello World', 100, 100);
  doc.end();
  res.send('PDF created!');
}); */

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

/* 
app.get('/download-pdf/:studentId/:typeFile/:fileName', (req, res) => {
  const { fileName, typeFile, studentId } = req.params;
  const filePath = `upload/${typeFile}/${fileName}`;
  console.log(fileName, typeFile);

  if (typeFile === 'informe') {
    db.query("SELECT * FROM informes WHERE Id_estudiante = ?", [studentId], (error, results) => {
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
    });
  }
  /* res.download(filePath, fileName, (err) => {
    if (err) {
      console.error("Error al descargar el archivo:", err);
      res.status(500).json({
        error: "Error al descargar el archivo",
        status: false
      });
    } 
  });
}); */