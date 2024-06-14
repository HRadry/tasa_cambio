import axios from 'axios';
import { Client } from 'pg';

//Configuración de la base de datos
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'tc_base',
    password: 'p45sw0rd',
    port: 5432,

});

// Conectar a la base de datos
async function connectToDB() {
    try {
        await client.connect();
        console.log('Conexión correcta')
    } catch (err) {
        console.error('Error al conectar a la base de datos', err);
    }
}

//obtener las tasas de cambio
async function getTasaCambio() {
    const myToken = '18eadfc093eaecb7b3750ce1a669bdd9db41ad1fcb1bcd2ae38875bf024b9772';
    const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718,SF46410/datos/oportuno?token=${myToken}`;
    try {
        const response = await axios.get(url);
        const data = response.data.bmx.series;
        const date = data[0].datos[0].fecha;
        const tasaUSD = parseFloat(data.find((series: any) => series.idSerie === 'SF43718').datos[0].dato);
        const tasaEUR = parseFloat(data.find((series: any) => series.idSerie === 'SF46410').datos[0].dato);
        return { date, tasaUSD, tasaEUR };
    } catch (error) {
        console.log('Error al obtener las tasas: ', error);
        return null;
    }
}

async function storeTC(date: string, tasaUSD: number, tasaEUR: number) {
    const query = 'INSERT INTO tasa_cambio(fecha, tasa_cambio_usd, tasa_cambio_eur) values ($1, $2, $3)'

    try {
        await client.query(query, [date, tasaUSD, tasaEUR]);
        console.log('Tasas de cambio almacenadas con éxito');
    } catch (error) {
        console.log('Error al almacenar las tasas de cambio: ', error)
    }
}

async function showTC() {
    const query = 'SELECT * FROM tasa_cambio';

    try {
        const res = await client.query(query);
        res.rows.forEach((row: any) => {
            console.log(`Fecha: ${row.fecha} - USD: ${row.tasa_cambio_usd} - EUR: ${row.tasa_cambio_eur}`);
        });
    } catch (error) {
        console.error('Error al mostrar la tabla: ' + error);
    }
}

//Ejecutar
(async () => {
    await connectToDB();
    const tasas = await getTasaCambio();

    if (tasas) {
        await storeTC(tasas?.date, tasas?.tasaEUR, tasas?.tasaEUR)

    }

    await showTC();

    await client.end();

})();

