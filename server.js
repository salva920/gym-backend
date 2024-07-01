const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

// Conexión a MongoDB Atlas
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Conectado a MongoDB Atlas');
}).catch((err) => {
  console.error('Error conectando a MongoDB Atlas:', err);
});

// Definición del esquema y modelo del cliente
const clienteSchema = new mongoose.Schema({
  nombre: String,
  cedula: String,
  telefono: String,
  correo: String,
  direccion: String,
  fecha_nacimiento: Date,
  sexo: String,
  peso: String,
  horario: String,
  historial_medico: String,
  tipo_entrenamiento: String,
  fecha_inicio: Date,
  tipo_membresia: String,
  estado_pago: String,
  fechaRegistro: Date,
  notas: String
});

const Cliente = mongoose.model('Cliente', clienteSchema);

// Middleware para verificar el token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).send('Token is required');
  }
  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(500).send('Invalid Token');
    }
    req.userId = decoded.id;
    next();
  });
};

// Ruta para login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Aquí debes cambiar para verificar usuario y contraseña en MongoDB
  // Ejemplo simple: const user = await User.findOne({ username, password });
  // if (!user) { return res.status(401).send('Invalid credentials'); }
  if (username === 'admin' && password === 'password') { // Simulación de autenticación
    const token = jwt.sign({ id: username }, SECRET_KEY, { expiresIn: '1h' });
    return res.send({ auth: true, token });
  } else {
    return res.status(401).send('Invalid credentials');
  }
});

// Rutas de la API protegidas
app.get('/api/clientes', verifyToken, (req, res) => {
  Cliente.find({}, (err, result) => {
    if (err) {
      console.error('Error al obtener los clientes:', err);
      return res.status(500).send('Error al obtener los clientes');
    }
    res.send(result);
  });
});

app.post('/api/clientes', verifyToken, (req, res) => {
  let newCliente = req.body;
  Cliente.create(newCliente, (err, result) => {
    if (err) {
      console.error('Error al agregar el cliente:', err);
      return res.status(500).send('Error al agregar el cliente');
    }
    res.send(result);
  });
});

app.put('/api/clientes/:id', verifyToken, (req, res) => {
  let updateCliente = req.body;
  Cliente.findByIdAndUpdate(req.params.id, updateCliente, { new: true }, (err, result) => {
    if (err) {
      console.error('Error al actualizar el cliente:', err);
      return res.status(500).send('Error al actualizar el cliente');
    }
    res.send(result);
  });
});

app.delete('/api/clientes/:id', verifyToken, (req, res) => {
  Cliente.findByIdAndDelete(req.params.id, (err, result) => {
    if (err) {
      console.error('Error al eliminar el cliente:', err);
      return res.status(500).send('Error al eliminar el cliente');
    }
    res.send(result);
  });
});

// Sirve el frontend de React
app.use(express.static(path.join(__dirname, '..', 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
