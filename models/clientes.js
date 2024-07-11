const mongoose = require('mongoose');

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

module.exports = Cliente;
