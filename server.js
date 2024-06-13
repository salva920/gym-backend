const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = process.env.SECRET_KEY;

// Configuración de la base de datos utilizando variables de entorno
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT // Asegúrate de añadir esta línea si tu puerto no es el predeterminado
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to database');
});

// Middleware para verificar el token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).send('Token is required');
  }
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(500).send('Invalid Token');
    }
    req.userId = decoded.id;
    next();
  });
};

// Ruta para login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      const token = jwt.sign({ id: result[0].id }, SECRET_KEY, { expiresIn: '1h' });
      res.send({ auth: true, token });
    } else {
      res.send({ auth: false, token: null });
    }
  });
});

// Rutas de la API protegidas
app.get('/clientes', verifyToken, (req, res) => {
  let sql = 'SELECT * FROM clientes';
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.post('/clientes', verifyToken, (req, res) => {
  let newCliente = req.body;
  let sql = 'INSERT INTO clientes SET ?';
  db.query(sql, newCliente, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.put('/clientes/:id', verifyToken, (req, res) => {
  let updateCliente = req.body;
  let sql = `UPDATE clientes SET ? WHERE id = ${req.params.id}`;
  db.query(sql, updateCliente, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.delete('/clientes/:id', verifyToken, (req, res) => {
  let sql = `DELETE FROM clientes WHERE id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// Función para actualizar el estado de los clientes
const actualizarEstadoClientes = () => {
  const hoy = new Date();
  const sql = 'SELECT id, fechaRegistro, estado_pago FROM clientes';
  db.query(sql, (err, clientes) => {
    if (err) throw err;

    clientes.forEach(cliente => {
      const fechaRegistro = new Date(cliente.fechaRegistro);
      const diferenciaMeses = (hoy.getFullYear() - fechaRegistro.getFullYear()) * 12 + (hoy.getMonth() - fechaRegistro.getMonth());

      if (diferenciaMeses >= 1 && cliente.estado_pago === 'Pagado') {
        const updateSql = 'UPDATE clientes SET estado_pago = ? WHERE id = ?';
        db.query(updateSql, ['Pendiente', cliente.id], (err, result) => {
          if (err) throw err;
          console.log(`Cliente con id ${cliente.id} actualizado a Pendiente`);
        });
      }
    });
  });
};

// Programar el cron job para que se ejecute todos los días a la medianoche
cron.schedule('0 0 * * *', actualizarEstadoClientes, {
  scheduled: true,
  timezone: 'America/New_York' // Ajusta la zona horaria según sea necesario
});

// Ejecutar inmediatamente al iniciar el servidor
actualizarEstadoClientes();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
