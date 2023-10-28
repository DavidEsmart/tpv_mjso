const { MongoClient } = require("mongodb")
const express = require('express')
const api = express()
const cors = require('cors')
const port = 3000

const { craftearReferencia } = require("./utilities.js")


api.use(cors())
api.use(express.json())

const dbClient = new MongoClient("mongodb://127.0.0.1:27017");
const db = dbClient.db("tpv_mjso")

const ProductosCollection = db.collection("Productos")
const SettingsCollection = db.collection("Settings")
const VentasCollection = db.collection("Ventas")


// Lee y devuelve datos sobre un producto
// localhost:3000/producto?producto=0
api.get("/producto", async (req, res) => {
  // Comprueba que es un numero
  var productoID
  try {
    if(!req.query.producto){
      return
    } 
    else {
      productoID = parseInt(req.query.producto)
    }
  } 
  catch (error) {
    console.error(error)
  }
  
  // Lo busca en la base de datos
  var producto = await ProductosCollection.findOne({ "Referencia":productoID })

  // Si existe lo notificara
  if(producto) {
    delete producto._id
    res.send(producto)
  }
  else {
    res.status(404).send({"message":"El producto no existe"})
  }

})

// Lee la venta segun su referencia especificado
// localhost:3000/venta?venta=0
api.get("/venta", async (req, res) => {
  // Comprueba que es un numero
  var ventaID
  try {
    if(!req.query.venta) return
    ventaID = parseInt(req.query.venta)
  } 
  catch (error) {
    console.error(error)
  }

  // Lo busca en la base de datos
  var venta = await VentasCollection.findOne({ "Referencia":parseInt(ventaID) })

  // Si existe lo notificara
  if(venta) {
    delete venta._id
    res.status(200).send(venta)
  }
  else {
    res.status(404).send({"message":"La venta no existe"})
  }

})

// Anade un producto a la base de datos
api.post("/producto", async (req, res) => {
  var referencia = unixTimestamp()

  var nombre = req.query.nombre
  var precio = req.query.precio

  if(!nombre){
    res.status(422).send({"message":"Falta el nombre"})
    return
  }
  if(!precio){
    res.status(422).send({"message":"Falta el precio"})
    return
  }


  try {
    precio = parseFloat(precio)
  } catch (error) {
    console.error(error)
    res.status(422).send("El precio debe ser decimal")
    return
  }

  const nuevoProducto = {
    "Referencia":referencia,
    "Nombre":nombre,
    "Precio":precio,
  }

  await ProductosCollection.insertOne(nuevoProducto)

  delete nuevoProducto._id

  res.send(nuevoProducto)
})


// Anade una BASE de venta a la base de datos
api.post("/venta", async (req, res) => {
  const referencia = craftearReferencia()

  var fecha = req.query.fecha
  var IVA = req.query.IVA
  var coste = req.query.coste
  var metodoPago = req.query.metodoPago
  var cambio = req.query.cambio

  if(!(fecha && IVA && coste && metodoPago && cambio)){
    res.status(422).send({"message":"Falta información"})
    return
  }

  try {
    coste = parseFloat(coste)
    cambio = parseFloat(cambio)
  } catch (error) {
    console.log(error)
  }

  const nuevaVenta = {
    "Referencia":referencia,
    "Fecha":fecha,
    "IVA":IVA,
    "Coste":coste,
    "Metodo_pago":metodoPago,
    "Pagos":[],
    "Cambio":cambio,
    "Productos":[]
  }

  await VentasCollection.insertOne(nuevaVenta)

  delete nuevaVenta._id
  res.send(nuevaVenta)

})

// Agrega pagos a una venta base
api.post("/venta_pago", async (req, res) => {
  var referencia = req.query.referencia
  var metodo = req.query.metodo
  var cantidad = req.query.cantidad

  if(!(referencia && metodo && cantidad)){
    return
  }

  try {
    cantidad = parseFloat(cantidad)
    referencia = parseInt(referencia)
  } catch (error) {
    console.error(error)
  }

  const nuevoPago = {
    "Metodo":metodo,
    "Cantidad" :cantidad
  }

  var ventaAntigua = await VentasCollection.findOne({"Referencia":referencia})

  console.log(ventaAntigua)

  ventaAntigua.Pagos.push(nuevoPago)

  await VentasCollection.findOneAndReplace({"Referencia":referencia},ventaAntigua)

  res.send(ventaAntigua)

})


// Añade un producto a la venta base
api.post("/venta_producto", async (req, res) => {
  var referencia = req.query.referencia
  var referencia_producto = req.query.referencia_producto
  var nombre = req.query.nombre
  var cantidad = req.query.cantidad
  var devuelto = req.query.devuelto
  var precio = req.query.precio
  var fechaDevolucion = req.query.fechaDevolucion

  if(!(referencia && nombre && cantidad && precio && referencia_producto)){
    return
  }

  if(typeof devuelto == "undefined"){
    devuelto = false
  }

  try {
    cantidad = parseInt(cantidad)
    referencia = parseInt(referencia)
    precio = parseFloat(precio)
  } catch (error) {
    console.error(error)
  }

  const nuevoProducto = {
    "Nombre":nombre,
    "Cantidad": cantidad,
    "Referencia": referencia_producto,
    "Devuelto" : devuelto,
    "Precio" : precio,
    "Fecha_Devolucion" : fechaDevolucion
  }

  var ventaAntigua = await VentasCollection.findOne({"Referencia":referencia})

  ventaAntigua.Productos.push(nuevoProducto)

  await VentasCollection.findOneAndReplace({"Referencia":referencia},ventaAntigua)

  res.send(ventaAntigua)

})


// Pone a la escucha la API
api.listen(port, () => {
  console.log(`Example api listening on port ${port}`)
})