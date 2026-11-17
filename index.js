/*
Practica 1 de Despliegue: API REST de eventos, entradas y recintos.
Servidor principal: carga librerias, conecta con MongoDB y monta los enrutadores.
*/

// Carga de librerias
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Carga de enrutadores
import recintos from './routes/recintos.js';
import eventos from './routes/eventos.js';

// Leer las variables de entorno del fichero .env
dotenv.config();

// Conectar con BD en Mongo
mongoose.connect(process.env.URL_BD);

// Inicializar Express
let app = express();

// Cargar middleware para peticiones POST y PUT
app.use(express.json());

// Montar los enrutadores
app.use('/recintos', recintos);
app.use('/eventos', eventos);

// Arrancar el servidor (en Render el puerto llega en PORT)
let puerto = process.env.PORT || process.env.PUERTO;
app.listen(puerto, () => {
    console.log('Servidor escuchando en el puerto ' + puerto);
});
