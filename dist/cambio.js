"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const pg_1 = require("pg");
//Configuración de la base de datos
const client = new pg_1.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'tc_base',
    password: 'p45sw0rd',
    port: 5432,
});
// Conectar a la base de datos
function connectToDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            console.log('Conexión correcta');
        }
        catch (err) {
            console.error('Error al conectar a la base de datos', err);
        }
    });
}
//obtener las tasas de cambio
function getTasaCambio() {
    return __awaiter(this, void 0, void 0, function* () {
        const myToken = '18eadfc093eaecb7b3750ce1a669bdd9db41ad1fcb1bcd2ae38875bf024b9772';
        const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718,SF46410/datos/oportuno?token=${myToken}`;
        try {
            const response = yield axios_1.default.get(url);
            const data = response.data.bmx.series;
            const date = data[0].datos[0].fecha;
            const tasaUSD = parseFloat(data.find((series) => series.idSerie === 'SF43718').datos[0].dato);
            const tasaEUR = parseFloat(data.find((series) => series.idSerie === 'SF46410').datos[0].dato);
            return { date, tasaUSD, tasaEUR };
        }
        catch (error) {
            console.log('Error al obtener las tasas: ', error);
            return null;
        }
    });
}
function storeTC(date, tasaUSD, tasaEUR) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = 'INSERT INTO tasa_cambio(fecha, tasa_cambio_usd, tasa_cambio_eur) values ($1, $2, $3)';
        try {
            yield client.query(query, [date, tasaUSD, tasaEUR]);
            console.log('Tasas de cambio almacenadas con éxito');
        }
        catch (error) {
            console.log('Error al almacenar las tasas de cambio: ', error);
        }
    });
}
function showTC() {
    return __awaiter(this, void 0, void 0, function* () {
        const query = 'SELECT * FROM tasa_cambio';
        try {
            const res = yield client.query(query);
            res.rows.forEach((row) => {
                console.log(`Fecha: ${row.fecha} - USD: ${row.tasa_cambio_usd} - EUR: ${row.tasa_cambio_eur}`);
            });
        }
        catch (error) {
            console.error('Error al mostrar la tabla: ' + error);
        }
    });
}
//Ejecutar
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield connectToDB();
    const tasas = yield getTasaCambio();
    if (tasas) {
        yield storeTC(tasas === null || tasas === void 0 ? void 0 : tasas.date, tasas === null || tasas === void 0 ? void 0 : tasas.tasaEUR, tasas === null || tasas === void 0 ? void 0 : tasas.tasaEUR);
    }
    yield showTC();
    yield client.end();
}))();
