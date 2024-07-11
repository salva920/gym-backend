const cron = require('node-cron');
const mongoose = require('mongoose');

// Configuración de la conexión a la base de datos
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Conectado a MongoDB Atlas');
}).catch((err) => {
  console.error('Error conectando a MongoDB Atlas:', err);
});

// Definir el esquema y modelo del cliente
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

// Función para actualizar el estado de pago de los clientes
const actualizarEstadoClientes = async () => {
  try {
    const clientes = await Cliente.find({});
    const hoy = new Date();

    for (const cliente of clientes) {
      const fechaRegistro = new Date(cliente.fechaRegistro);
      if (isNaN(fechaRegistro)) {
        console.error(`Fecha de registro inválida para el cliente: ${cliente._id}`);
        continue;
      }

      const diferenciaMeses = (hoy.getFullYear() - fechaRegistro.getFullYear()) * 12 + (hoy.getMonth() - fechaRegistro.getMonth());

      if (diferenciaMeses >= 1 && cliente.estado_pago === 'Solvente') {
        cliente.estado_pago = 'Pendiente';
        await cliente.save();
      }
    }
    console.log('Estados de pago actualizados');
  } catch (err) {
    console.error('Error al actualizar los estados de pago:', err);
  }
};

// Programar el cron job para que se ejecute todos los días a la medianoche
cron.schedule('0 0 * * *', actualizarEstadoClientes, {
  scheduled: true,
  timezone: 'America/New_York', // Ajusta la zona horaria según sea necesario
});

module.exports = { actualizarEstadoClientes };
