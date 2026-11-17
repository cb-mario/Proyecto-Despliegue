import express from 'express';

import Evento from '../models/evento.js';
import Recinto from '../models/recinto.js';

let router = express.Router();

// GET /eventos : listado de todos los eventos con los datos de su recinto
router.get('/', async (req, res) => {
    try{
        let resultado = await Evento.find().populate('recinto');
        if(resultado.length > 0){
            res.status(200).send({ok:true,resultado:resultado});
        }else{
            res.status(500).send({ok:false,error:"No se han encontrado eventos"});
        }
    }catch(err){
        res.status(500).send({ok:false,error:"No se han encontrado eventos"});
    }
});

// GET /eventos/localidad/:nombre : eventos futuros en recintos de esa localidad
// Ojo: las rutas especificas van antes que /:id
router.get('/localidad/:nombre', async (req, res) => {
    try{
        // Primero buscamos los recintos de la localidad
        let recintos = await Recinto.find({localidad:req.params['nombre']});
        // Nos quedamos solo con sus ids
        let ids = recintos.map(recinto => recinto._id);
        // Y ahora los eventos de esos recintos cuya fecha no haya pasado
        let resultado = await Evento.find({
            recinto: {$in: ids},
            fecha: {$gte: new Date()}
        }).populate('recinto');
        if(resultado.length > 0){
            res.status(200).send({ok:true,resultado:resultado});
        }else{
            res.status(404).send({ok:false,error:"No se han encontrado eventos"});
        }
    }catch(err){
        res.status(404).send({ok:false,error:"No se han encontrado eventos"});
    }
});

// GET /eventos/entradas/:idEvento/:tipoEntrada : precio y disponibles de un tipo de entrada
router.get('/entradas/:idEvento/:tipoEntrada', async (req, res) => {
    try{
        let evento = await Evento.findById(req.params['idEvento']);
        if(evento){
            // Buscamos dentro del array de entradas la del tipo indicado
            let entrada = evento.entradas.find(entrada => entrada.tipo == req.params['tipoEntrada']);
            if(entrada){
                res.status(200).send({ok:true,resultado:{precio:entrada.precio,disponibles:entrada.disponibles}});
            }else{
                res.status(404).send({ok:false,error:`Error obteniendo datos de entrada para evento ${req.params.idEvento}`});
            }
        }else{
            res.status(404).send({ok:false,error:`Error obteniendo datos de entrada para evento ${req.params.idEvento}`});
        }
    }catch(err){
        res.status(404).send({ok:false,error:`Error obteniendo datos de entrada para evento ${req.params.idEvento}`});
    }
});

// PUT /eventos/entradas/:idEvento/:tipoEntrada/:cantidad : vender entradas de un tipo
router.put('/entradas/:idEvento/:tipoEntrada/:cantidad', async (req, res) => {
    try{
        // La cantidad llega como texto en la URL, la pasamos a numero
        let cantidad = Number(req.params['cantidad']);
        if(!Number.isInteger(cantidad) || cantidad <= 0){
            return res.status(404).send({ok:false,error:`Error actualizando entradas del evento ${req.params.idEvento}`});
        }
        // Restamos en una sola operacion: solo actualiza si hay suficientes disponibles
        let resultado = await Evento.findOneAndUpdate(
            {
                _id: req.params['idEvento'],
                entradas: {$elemMatch: {tipo: req.params['tipoEntrada'], disponibles: {$gte: cantidad}}}
            },
            {$inc: {'entradas.$.disponibles': -cantidad}},
            {new: true}
        );
        if(resultado){
            res.status(200).send({ok:true,resultado:resultado});
        }else{
            res.status(404).send({ok:false,error:`Error actualizando entradas del evento ${req.params.idEvento}`});
        }
    }catch(err){
        res.status(404).send({ok:false,error:`Error actualizando entradas del evento ${req.params.idEvento}`});
    }
});

// GET /eventos/:id : un evento concreto con los datos de su recinto
router.get('/:id', async (req, res) => {
    try{
        let resultado = await Evento.findById(req.params['id']).populate('recinto');
        if(resultado){
            res.status(200).send({ok:true,resultado:resultado});
        }else{
            res.status(404).send({ok:false,error:`Evento ${req.params.id} no encontrado`});
        }
    }catch(err){
        res.status(404).send({ok:false,error:`Evento ${req.params.id} no encontrado`});
    }
});

// POST /eventos : crear un evento nuevo
router.post('/', async (req, res) => {
    try{
        let nuevoEvento = new Evento({
            nombre: req.body.nombre,
            fecha: req.body.fecha,
            entradas: req.body.entradas,
            recinto: req.body.recinto
        });
        let resultado = await nuevoEvento.save();
        res.status(201).send({ok:true,resultado:resultado});
    }catch(err){
        res.status(500).send({ok:false,error:"Error añadiendo evento"});
    }
});

// PUT /eventos/:id : actualizar un evento
router.put('/:id', async (req, res) => {
    try{
        let resultado = await Evento.findByIdAndUpdate(
            req.params['id'],
            req.body,
            {new: true, runValidators: true}
        );
        if(resultado){
            res.status(200).send({ok:true,resultado:resultado});
        }else{
            res.status(404).send({ok:false,error:`Error actualizando evento ${req.params.id}`});
        }
    }catch(err){
        res.status(404).send({ok:false,error:`Error actualizando evento ${req.params.id}`});
    }
});

// DELETE /eventos/:id : eliminar un evento
router.delete('/:id', async (req, res) => {
    try{
        let resultado = await Evento.findByIdAndDelete(req.params['id']);
        if(resultado){
            res.status(200).send({ok:true,resultado:resultado});
        }else{
            res.status(404).send({ok:false,error:`Error eliminando evento ${req.params.id}`});
        }
    }catch(err){
        res.status(404).send({ok:false,error:`Error eliminando evento ${req.params.id}`});
    }
});

export default router;
