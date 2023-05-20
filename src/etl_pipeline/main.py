import logging
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql import DataFrame
from pyspark.sql import functions as fn


BASE_PATH = ""
JSON_PATH = BASE_PATH + "/temp/json"
PARQUET_PATH = BASE_PATH + "/data"

logging.basicConfig(level=logging.INFO)


def get_spark_session() -> SparkSession:
    return SparkSession.builder.appName("scrapper_etl").master("local[4]").getOrCreate()


def get_actual_date_str(sep="-") -> str:
    return datetime.today().strftime(f"%Y{sep}%m{sep}%d")


def extract() -> DataFrame:
    today = get_actual_date_str()
    path = f"{JSON_PATH}/{today}.json"
    return get_spark_session().read.json(path)


def transform(df: DataFrame) -> DataFrame:
    spark = get_spark_session()
    df.createOrReplaceTempView("df")

    query = """--sql
        select
            split(linkArticle, '-')[1] as id
            split(dir, ',')[0] as direccion,
            split(dir, ',')[size(split(dir, ','))-1] as ciudad,
            linkArticle as link,
            metrosCuadrados as metros_cuadrados,
            case
                when lower(title) like '%monoambiente%' then 'MONOAMBIENTE'
                when lower(title) like '%apto%' or lower(title) like '%apartamento%' then 'APTO'
                else 'SIN DETERMINAR'
            end as tipo,
            title as titulo_publicacion,
            case
                when moneda = '$' then price
                when moneda = 'U$S' then (price * 38.41)
            end as precio_pesos_uy
        from df
    """
    return spark.sql(query)


def load(df: DataFrame):
    today = get_actual_date_str(sep="")
    path = f"{PARQUET_PATH}/{today}"

    # TODO - mejora:
    # leer todo el historico (o el de los ultimos meses)
    # ver si hay data duplicada, y sobrescribirla
    today = get_actual_date_str()
    df = df.withColumn("fecha_extraccion", fn.expr(f"to_date('{today}')"))

    df.write.parquet(path, mode="overwrite")


def main():
    logging.info("Procesando datos")
    df = transform(extract())
    logging.info("Persistiendo parquet...")
    load(df)


if __name__ == "__main__":
    main()
