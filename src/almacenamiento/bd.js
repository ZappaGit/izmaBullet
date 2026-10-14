// Apertura de la base de datos real en el dispositivo (expo-sqlite).
// Solo lo importa la app; las pruebas usan sql.js con el mismo adaptador.
import * as SQLite from 'expo-sqlite';

import { aplicarMigraciones } from './esquema';
import { crearRepositorios } from './repositorios';

let instancia = null;

export async function abrirRepositorios() {
  if (instancia) return instancia;
  const bd = await SQLite.openDatabaseAsync('izmabullet.db');
  await bd.execAsync('PRAGMA foreign_keys = ON;');
  await aplicarMigraciones(bd);
  instancia = crearRepositorios(bd);
  return instancia;
}
