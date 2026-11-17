import mongoose from 'mongoose';

// Esquema de entradas (subdocumento dentro de evento)
let esquemaEntradas = new mongoose.Schema({
    tipo: {
        type: String,
        required: true,
        minlength: 3
    },
    precio: {
        type: Number,
        required: true,
        min: 0
    },
    disponibles: {
        type: Number,
        required: true,
        min: 0,
        // Las entradas disponibles tienen que ser un numero entero
        validate: {
            validator: Number.isInteger,
            message: 'Las entradas disponibles deben ser un numero entero'
        }
    }
});

// Esquema de eventos
let eventoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        minlength: 5,
        trim: true
    },
    fecha: {
        type: Date,
        required: true
    },
    // Vinculacion de evento con sus entradas (subdocumento)
    entradas: [esquemaEntradas],
    // Vinculacion de evento con recinto
    recinto: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'recintos'
    }
});

let Evento = mongoose.model('eventos', eventoSchema);
export default Evento;
