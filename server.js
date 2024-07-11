const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const { actualizarEstadoClientes } = require('./cronjobs'); // Importa el cron job
const Cliente = require('./models/cliente'); // Importa el modelo de Cliente

const app = express();
app.use(cors());
app.use(bodyParser.json());

const MONGO_URI = process.env.MONGO_URI;

// Configuración de la conexión a la base de datos
mongoose.set('strictQuery', false); // Para evitar la advertencia de Mongoose
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Conectado a MongoDB Atlas');
  actualizarEstadoClientes(); // Ejecuta la función de actualización de estados al iniciar
}).catch((err) => {
  console.error('Error conectando a MongoDB Atlas:', err);
});

// Middleware para permitir todas las solicitudes
const allowAll = (req, res, next) => {
  next();
};

// Ruta para login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') { // Simulación de autenticación
    return res.send({ auth: true, token: 'fake-token' });
  } else {
    return res.status(401).send('Invalid credentials');
  }
});

app.get('/api/test-db-connection', async (req, res) => {
  try {
    await mongoose.connection.db.command({ ping: 1 });
    res.status(200).send('Pinged your deployment. You successfully connected to MongoDB!');
  } catch (err) {
    console.error('Error conectando a MongoDB:', err);
    res.status(500).send('Error conectando a MongoDB');
  }
});

// Función para formatear fechas al formato ISO (yyyy-MM-dd)
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

// Rutas de la API protegidas
app.get('/api/clientes', allowAll, (req, res) => {
  Cliente.find({}, (err, result) => {
    if (err) {
      console.error('Error al obtener los clientes:', err);
      return res.status(500).send('Error al obtener los clientes');
    }
    res.send(result);
  });
});

app.post('/api/clientes', allowAll, (req, res) => {
  let newCliente = req.body;
  newCliente.fecha_nacimiento = formatDate(newCliente.fecha_nacimiento);
  newCliente.fecha_inicio = formatDate(newCliente.fecha_inicio);
  newCliente.fechaRegistro = formatDate(newCliente.fechaRegistro);

  Cliente.create(newCliente, (err, result) => {
    if (err) {
      console.error('Error al agregar el cliente:', err);
      return res.status(500).send('Error al agregar el cliente');
    }
    res.send(result);
  });
});

app.put('/api/clientes/:id', allowAll, (req, res) => {
  let updateCliente = req.body;
  updateCliente.fecha_nacimiento = formatDate(updateCliente.fecha_nacimiento);
  updateCliente.fecha_inicio = formatDate(updateCliente.fecha_inicio);
  updateCliente.fechaRegistro = formatDate(updateCliente.fechaRegistro);

  Cliente.findByIdAndUpdate(req.params.id, updateCliente, { new: true }, (err, result) => {
    if (err) {
      console.error('Error al actualizar el cliente:', err);
      return res.status(500).send('Error al actualizar el cliente');
    }
    if (!result) {
      return res.status(404).send('Cliente no encontrado');
    }
    res.send(result);
  });
});

// Ruta para marcar como solvente
app.put('/api/clientes/solventar/:id', allowAll, (req, res) => {
  const clienteId = req.params.id;
  Cliente.findByIdAndUpdate(clienteId, { estado_pago: 'Solvente' }, { new: true }, (err, result) => {
    if (err) {
      console.error('Error al marcar como solvente:', err);
      return res.status(500).send('Error al marcar como solvente');
    }
    if (!result) {
      return res.status(404).send('Cliente no encontrado');
    }
    res.send(result);
  });
});

app.delete('/api/clientes/:id', allowAll, (req, res) => {
  const clienteId = req.params.id;
  console.log(`Intentando eliminar cliente con ID: ${clienteId}`);
  Cliente.findByIdAndDelete(clienteId, (err, result) => {
    if (err) {
      console.error('Error al eliminar el cliente:', err);
      return res.status(500).send('Error al eliminar el cliente');
    }
    if (!result) {
      console.log(`Cliente con ID: ${clienteId} no encontrado`);
      return res.status(404).send('Cliente no encontrado');
    }
    console.log(`Cliente con ID: ${clienteId} eliminado exitosamente`);
    res.send({ message: 'Cliente eliminado exitosamente' });
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
