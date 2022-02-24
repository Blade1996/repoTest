# Guía para Deploys

- Servidor de Desarrollo: 34.228.205.8
- Producción de ACL, Importador de Productos y Fact. Electronica están en el servidor de desarrollo (because we love living in the edge! And because we cannot afford more hardware)
- Servidor de Producción: 23.20.60.73
- Servidor de Reportes: 54.82.68.247

## Pre Requisitos

Si alguno de los nombres que vas a leer a continuación no significan nada para ti ten en cuenta que esto fue escrito el 2019-03-01.

1. Coordinar con Wendy y Arelis en caso hay hotfix en los repositorios de backend/frontend. En caso si haya hotfix se debe ir a la rama **dev** crear una rama **sincronizacion-hot-fix-[fecha]** de cada uno de los proyectos y hacer un merge con la rama **production**. Una vez hecho el merge y resuelto cualquier conflicto se debe hacer un pull request de esa rama hacia **dev**.
2. Si el deploy requiere de que una app mobile se suba a una de las tiendas también coordinar con Erick.
Este paso es uno de los más críticos ya que el update a las tiendas no se propaga automáticamente, sino puede demorar por lo menos 30 minutos en el mejor de los casos.
3. Nuevamente coordinar con Wendy en caso haya scripts sql que deben ejecutarse apenas el deploy se realice.
La palabra clave para ejecutar los scripts es "TÚMBALO".
4. Recién en este punto se puede crear los pulls de migracion a producción. Basicamente es crear un pull request desde **dev** a **production**.
5. Hacer el merge del pull request en los **repositorios de backend**. Para el caso de **frontend** hacer el merge indica que se haga el deploy de manera automática a produccián - gracias a netlify - por lo que se debe esperar a que todo el backend está listo.

## Como hacer deploy a producción de apps en NodeJs

### Conectar a la instancia de development (nuestra ip debe estar agregada en el firewall de amazon)

```bash
tumi-dev
# este alias solo funciona en la mac mini de Eduardo
# si se hace desde otra maquina usar ssh -i [ruta-a-archivo-pem.pem] ubuntu@[ip-servidor]
# el archivo pem y el IP los tiene marcelo
```

### Conectar a la instancia de production (nuestra ip debe estar agregada en el firewall de amazon)

```bash
tumi-prod
```

### Conectar a la instancia de production (nuestra ip debe estar agregada en el firewall de amazon)

```bash
tumi-reports
```

### Ver aplicaciones configuradas en el servidor

```bash
pm2 ps
# Este comando te devuelve info de la aplicación y un ID que es util para temas de monitoreo
```

### Reiniciar una aplicación

```bash
pm2 reload [id de aplicacion] # reinicia una aplicacion (el id se puede obtener al hacer un pm2 ps)
```

### Logs de una aplicación

Digamos que quiero ver el log del modulo de ventas

```bash
pm2 log 4

# también puede indicarse el nombre del proceso
pm2 log dp6-sales

# solo muestra las últimas 15 líneas, si se desea ver el log completo se debe hacer un cat a la ruta del archivo
# La ruta del archivo la muestra el mismo comando, para el modulo de ventas sería:
# /home/ubuntu/.pm2/logs/dp6-sales-out-4.log last 15 lines:
# /home/ubuntu/.pm2/logs/dp6-sales-error-4.log last 15 lines:
cat /home/ubuntu/.pm2/logs/dp6-sales-out-4.log | tail -n 100
# muestra las ultimas 100 lineas del log, los logs pueden ser grandes asi que siempre
# es bueno usar tail para solo mostrar una cantidad de lineas determinada.
```

Para las aplicaciones hechas en NodeJs se usa la rama **production** para el ambiente de producción. Antes de hacer un deploy
se debe tener todos los cambios en dicha rama.

Si se requieren cambios en el archivo **.env** estos deben hacerse ANTES de hacer el deploy.

### Modificar .env

Ir a la carpeta donde está clonado el proyecto, se pueden usar los alias.

```bash
sales # va a la carpeta del modulo de ventas
sudo nano .env # modificar .env, CTRL + X para salir, presionar Y para confirmar cambios.
cat .env # visualizar archivo para comprobar modificaciones
```

### Deploy a Produccion del modulo dp6SalesPurchase

Luego de tener los cambios en la rama de produccion ejecutar los siguientes comandos

```bash
sales # te lleva a la carpeta del modulo de ventas dp6SalesPurchase
```

```bash
deploy-sales # realiza el deploy a produccion (hace npm install, ejecuta migraciones, reinicia el proceso)
```

### Deploy a Produccion del modulo dp6WebAlmacen_Productos

Luego de tener los cambios en la rama de produccion ejecutar los siguientes comandos

```bash
products # te lleva a la carpeta del modulo de ventas dp6WebAlmacen_Productos
```

```bash
git pull origin production # baja cambios de la rama de produccion
```

```bash
npm install # en caso se haya instalado nuevas dependencias
```

```bash
pm2 reload 0 # reinicia el proceso para aplicar cambios.
```

### Deploy a Produccion del modulo dp6ApiProducts

Luego de tener los cambios en la rama de produccion ejecutar los siguientes comandos

```bash
products2 # te lleva a la carpeta del modulo de ventas dp6ApiProducts
```

```bash
deploy-products # realiza el deploy a produccion (hace npm install, ejecuta migraciones, reinicia el proceso)
```

Los deploys a development son automáticos cada vez que se hace merge en la rama dev. Se notifica al channel de slack #deployments.

### Deploy a Produccion del modulo dp6ApiReports

Luego de tener los cambios en la rama de produccion ejecutar los siguientes comandos

```bash
reports # te lleva a la carpeta del modulo de ventas dp6
```

```bash
deploy-reports # realiza el deploy a produccion (hace npm install, ejecuta migraciones, reinicia el proceso)
```

### Limpiar logs al inicio del día

Nuestras poderosas instancias no pueden mantener mucha cantidad de logs así que como recomendación hacer una limpieza de ellos al
empezar el día.

```bash
pm2 flush
```

Los deploys a development son automáticos cada vez que se hace merge en la rama dev. Se notifica al channel de slack #deployments.

## Como hacer deploys de apps basadas en PHP

```bash
con-dev # alias para conectarse a la instancia de controlinn produccion, solo funciona en mac mini de Eduardo
```

### Deploy para dp6ApiPms

```bash
deploy-pms
```

Si los cambios necesitan ejecutar migraciones o actualizar dependencias hacerlo manualmente

```bash
cd source
php artisan migrate
# ejecuta migraciones
```

```bash
cd source
php composer.phar update
# instala nuevas dependencias
```

### Los demas proyectos de php deben hacerse a la forma manual

```bash
cd webs/[nombre_repositorio]
git pull origin dev
```
