// Cliente de Supabase para la app. Sin EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY
// devuelve null: la app sigue funcionando sin cuenta y las pantallas lo explican.
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { crearAlmacenSesion } from './almacenSesion';
import { crearServicioCuenta } from './servicio';

// Las variables EXPO_PUBLIC_ se leen literales: Expo las sustituye en el bundle.
const URL_SUPABASE = process.env.EXPO_PUBLIC_SUPABASE_URL;
const CLAVE_PUBLICA = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let servicio;

export function obtenerServicioCuenta() {
  if (servicio !== undefined) return servicio;
  if (!URL_SUPABASE || !CLAVE_PUBLICA) {
    servicio = null;
    return servicio;
  }
  const cliente = createClient(URL_SUPABASE, CLAVE_PUBLICA, {
    auth: {
      storage: crearAlmacenSesion(SecureStore),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  servicio = crearServicioCuenta(cliente);
  return servicio;
}
