import { Router } from "express";
import { db } from "../db.js";
import bcrypt from 'bcrypt';
const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  const query = `SELECT * FROM Login WHERE usuario = ?`;
  db.query(query, [usuario], (err, result) => {
    if (err) {
      res.status(500).json({
        error: err.message,
        status: false,
        message: 'Error al buscar usuario'
      });
      return;
    }
    if (result.length === 0) {
      res.status(404).json({
        status: false,
        message: 'Usuario no encontrado'
      });
      return;
    }
    const user = result[0];
    //console.log(result);
    //console.log(user);
    //console.log(password, user.password);
    if (!(bcrypt.compareSync(password, user.password))) {
      res.status(401).json({
        status: false,
        message: 'Contraseña incorrecta'
      });
      return;
    }
    // generar token
    const secret = process.env.JWT_SECRET
    const hashSecret = bcrypt.hashSync(secret, 10);
    res.status(200).json({
      status: true,
      message: 'Usuario autenticado correctamente',
      data: {
        token: hashSecret,
        id: user.id,
        usuario: user.usuario,
        email: user.email,
      }
    });
  });
});

authRouter.post('/register', (req, res) => {
  const { usuario, password, email } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  // validation usenmae must be unique
  const queryUsername = `SELECT * FROM Login WHERE usuario = ?`;
  db.query(queryUsername, [usuario], (err, result) => {
    if (err) {
      res.status(500).json({
        error: err.message,
        status: false,
        message: 'Error al buscar usuario'
      });
      return;
    }
    if (result.length > 0) {
      res.status(400).json({
        status: false,
        message: 'Usuario ya existe'
      });
      return;
    }
  });
  //validation for email must be unique
  const queryEmail = `SELECT * FROM Login WHERE email = ?`;
  db.query(queryEmail, [email], (err, result) => {
    if (err) {
      res.status(500).json({
        error: err.message,
        status: false,
        message: 'Error al buscar email'
      });
      return;
    }
    if (result.length > 0) {
      res.status(400).json({
        status: false,
        message: 'Email ya existe'
      });
      return;
    }
  });
  const query = `INSERT INTO Login (usuario, password, email) VALUES (?, ?, ?)`;
  // console.log(query);
  db.query(query, [usuario, hashedPassword, email], (err, result) => {
    if (err) {
      // console.log(err);
      res.status(500).json({
        error: err.message,
        status: false,
        message: 'Error al registrar usuario'
       });
      return;
    }
    console.log(result);
    res.status(201).json({
      status: true,
      message: 'Usuario registrado correctamente',
      data: {
        id: result.insertId,
        usuario,
        email,
      }
    });
  });
});

export default authRouter;