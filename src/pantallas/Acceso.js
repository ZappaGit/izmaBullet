// Inicio de sesión de la app. Tras entrar, o al continuar sin cuenta, va al Índice.
import { useRouter } from 'expo-router';

import Entrar from './cuenta/Entrar';

export default function Acceso() {
  const router = useRouter();
  const irAIndice = () => router.replace('/indice');

  return <Entrar alEntrar={irAIndice} alSaltar={irAIndice} />;
}
