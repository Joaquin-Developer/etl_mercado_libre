# ETL de MercadoLibre

La idea es desarrollar un pequeño ETL para algunos productos de MercadoLibre.


El proyecto incluye los siguientes aplicativos:

### 1- Web Scrapper (JavaScript application)
Script que se encarga de realizar el scrapping en la página y guardar los datos en JSON en local.
Obtiene una lista de 500 productos, por categoría, y obtenemos ciertos valores, como nombre, precio, id_producto, descripción, etc.

### 2- Pipeline ETL (Spark/Python)
Pipeline en spark, que lee el JSON generado, aplica transformaciónes, y lo persiste en disco, en formato parquet.


#### Periodicidad de ejecución:
La app spark se ejecuta una vez que haya finalizado con éxito el scrapping. La periodicidad es diaria. Este ETL correrá todos los dias a las 16:00 hs UY.
