//Importar la librería
const express = require('express');
const colors = require('colors');
const process = require('process'); //preinstalada
const filesystem = require('fs'); //prede
const request = require('request');
const bodyparser = require('body-parser');
const bcrypt = require('bcrypt'); //para cifrar
const jsonwebtoken = require('jsonwebtoken'); //para crear tokens
const expressjwt = require('express-jwt'); //comprueba el header del token en las llamadas

//Variables globales
var jwtClaveRaw = filesystem.readFileSync('secrets.json');
var jwtClave = JSON.parse(jwtClaveRaw); //el que quiera usarlo tiene que crear un archivo secrets.json poniendo una clave
//console.log(jwtClave['jwt_key']); //compruebo sii funciona

//Puerto
const puerto = process.argv[2];

//Crear la variable de la api
const app = express(); //ésto es expressJS

//Añadir Middlewares
app.use(bodyparser()); //le aplicamos bodyparser para que lo haga siempre que le llegue un body en una petición post

app.use(expressjwt({
  secret: jwtClave['jwt_key']//tengo que meter [jwt_key] para que dentro del string acceda a la key. Tambien podría crear un let miClave = jwtClave[jwt_key] y pasarlo como variable global y luego llamar a miClave y ya estaría.
}).unless({
  path: ["/login", "/register"]
})); //comrpueba que el token esté en nuestros path escepto en login y register

//Configurar las rutas
//REGISTER
app.post('/register', function(req, res) {

  console.log("Registrando usuario".red);

  //cargar usuarios actuales
  var rawData = filesystem.readFileSync('users.json');
  var users = JSON.parse(rawData);

  // anadir nuevo usuario
  const hash = bcrypt.hashSync(req.body.password, 10);
  users.push({"email": req.body.email, "password": hash});

  let usersJSON = JSON.stringify(users);//lo metemos en una variable para verlo más claro.

  filesystem.writeFileSync('users.json', usersJSON); //lo que registra de la petición post

  res.send('usuario creado');
});

//LOGIN
app.post('/login', function(req, res) {
  console.log("Autentificando...".green);
  var rawData = filesystem.readFileSync('users.json');
  var data = JSON.parse(rawData);


  for (var i = 0; i < data.length; i++) {
    if (bcrypt.compareSync(req.body.password, data[i]['password'])) {

      var token = jsonwebtoken.sign({
        email: req.body.email
      }, jwtClave['jwt_key']);//le tengo que pasar el objeto del array para detectarlo

      res.send("Bienvenido! tu json Web Token es: " + token);
    } else {
      res.send("Contraseña Incorrecta");
    }
  }

});

app.get('/products', function(req, res) {
  let rawData = filesystem.readFileSync('./data.json');
  let producto = JSON.parse(rawData);
  //el header va antes del send
  res.setHeader("Allow-Control-Allow-Origin", "*");
  console.log('Petición a nuestra Api para obetener el data.json Successfull.'.green);
  res.send(producto);
});

app.get('/products/:productID', function(req, res) {
  let rawData = filesystem.readFileSync('./data.json');
  let producto = JSON.parse(rawData);
  let productoSelected = {}; //objeto a imprmir
  for (var i = 0; i < producto.length; i++) { //Bucle For para que mire cada prouctID en mi Array
    if (producto[i]["productID"] == req.params.productID) { //el resultado lo compara con el número que pongo en el Navegador
      productoSelected = producto[i]; //al ponerlo de ésta manera, lo mete en el dataselected vacio.
    }
  }
  //el header va antes del send
  res.setHeader("Allow-Control-Allow-Origin", "*");
  console.log('data.json/ID Successfull.'.green);
  res.send(productoSelected);
});


app.post('/products/', function(req, res) { //petición añadir un producto por ID
  let rawData = filesystem.readFileSync('./data.json');
  let producto = JSON.parse(rawData);
  let productoExiste = false; //objeto a imprmir

  for (var i = 0; i < producto.length; i++) { //Bucle For para que mire cada prouctID en mi Array
    if (producto[i]["productID"] == req.body.productID) { //el resultado lo compara con el número que pongo en el Navegador
      productoExiste = true; //al ponerlo de ésta manera, lo mete en el dataselected vacio.
    }
  }

  if (productoExiste == true) {
    console.log('Ese productID ya existe. Por favor,indique otro.');
    res.send({
      "error": "Este producto ya existe"
    })
  } else {
    console.log("no existe");
  }
});






//escuchar en un puerto
console.log(`escuchando en el puerto ${puerto}`.green);
app.listen(puerto);
