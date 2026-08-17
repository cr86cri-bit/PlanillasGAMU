import "./estilos/variables.css";
import "./estilos/global.css";
import "./estilos/utilidades.css";
import "./estilos/adaptable.css";
import "./componentes/componentes.css";

import { crearAplicacion } from "./aplicacion/Aplicacion.js";

const contenedorRaiz = document.querySelector("#raiz");

crearAplicacion(contenedorRaiz);
