const cron = require('node-cron');
const Cliente = require('./models/cliente');

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
