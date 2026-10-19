(function () {
// Configuración editable: autos, preguntas/pesos y textos dinámicos.
// Nada de esto vive en el HTML.

const CONFIG = {
  // Poner en true SOLO para pruebas: expone window.simulateAll() en consola.
  DEBUG: false,
  TOTAL_QUESTIONS: 10,
  POINTS_PRIMARY: 2,
  POINTS_SECONDARY: 1,
  AUTO_ADVANCE_MS: 350,
  // Las preguntas con índice >= a este valor (6 a 10) se usan en el 2.º desempate
  TIEBREAK_FROM_INDEX: 5,
};

// TODO(cliente): validar descripciones, precios y datos técnicos (price / specs / note) con información oficial de Mercedes-Benz.
// price / specs / note los usa la historia de modelos del Inicio; el resultado del test sigue sin mostrar cifras técnicas.
const CARS = {
  carro1: {
    id: 'carro1',
    name: 'GLC Coupé',
    image: 'img/carro1.webp',
    tagline: 'El coupé elegante',
    price: 'Desde $90,900',
    specs: [
      { label: 'Potencia', value: '258 hp' },
      { label: 'Par máximo', value: '400 Nm' },
      { label: '0–100 km/h', value: '6,3 s' },
      { label: 'Remolque (sin/con frenos)', value: '750 / 2.400 kg' },
    ],
    note: 'GLC 220d, GLC 200 Avantgarde y GLC 200 AMG Line · 1.999 cc / 4 en línea turbo',
    description:
      'Elegancia, diseño y carácter para el día a día. Un SUV coupé pensado para quien se mueve con estilo entre la ciudad y la oficina.',
    features: ['Elegancia ejecutiva', 'Línea coupé con carácter deportivo', 'Practicidad de SUV con mucho estilo'],
  },
  carro2: {
    id: 'carro2',
    name: 'GLC SUV',
    image: 'img/carro2.webp',
    tagline: 'El versátil',
    price: 'Desde $83,900',
    specs: [
      { label: 'Potencia', value: '258 hp' },
      { label: 'Maletero', value: 'Hasta 1.680 L' },
      { label: 'Remolque (con/sin frenos)', value: '2.000 / 750 kg' },
      { label: 'Asientos', value: '5' },
    ],
    note: 'GLC 220d Avantgarde, GLC 200 Avantgarde · 1.999 cc / 4 en línea turbo',
    description:
      'Premium práctico, cómodo y listo para la ciudad, la familia y la carretera. El equilibrio ideal entre espacio, confort y presencia.',
    features: ['Versatilidad para todos los días', 'Espacio y confort para la familia', 'Equipamiento pensado para la carretera'],
  },
  carro3: {
    id: 'carro3',
    name: 'Clase G',
    image: 'img/carro3.webp',
    tagline: 'El ícono',
    price: 'Precio bajo consulta',
    specs: [
      { label: 'Capacidad ascensional', value: 'Hasta 100 %' },
      { label: 'Vadeo', value: 'Hasta 70 cm' },
      { label: 'Inclinación lateral máx.', value: '70 %' },
      { label: 'Altura libre', value: '24,1 cm' },
    ],
    description:
      'Presencia, carácter y capacidad para cualquier terreno. Un ícono atemporal que se reconoce al instante.',
    features: ['Presencia inconfundible', 'Capacidad para cualquier terreno', 'Carácter que no pasa de moda'],
  },
  carro4: {
    id: 'carro4',
    name: 'GLE Coupé',
    image: 'img/carro4.webp',
    tagline: 'El deportivo con estilo',
    price: '$139,900',
    specs: [
      { label: 'Potencia', value: '367 + 20 cv' },
      { label: 'Consumo mixto', value: 'Hasta 15,6 km/L' },
      { label: '0–100 km/h', value: '5,6 s' },
    ],
    description:
      'Diseño impactante, potencia y sensaciones al volante. Para quien busca que cada trayecto sea una excusa para manejar.',
    features: ['Diseño que impacta', 'Sensaciones deportivas al volante', 'Estilo coupé con espíritu SUV'],
  },
  carro5: {
    id: 'carro5',
    name: 'EQS Sedán',
    image: 'img/carro5.jpg',
    tagline: 'El máximo lujo eléctrico',
    price: 'Sin precio publicado',
    specs: [
      { label: 'Autonomía', value: 'Hasta 682 km' },
      { label: 'Batería', value: '108,4 kWh útiles' },
      { label: 'Potencia', value: 'Hasta 523 hp' },
      { label: 'Par máximo', value: 'Hasta 858 Nm' },
    ],
    note: 'WLTP: 16 kWh/100 km · 0 g/km CO₂ · hasta 769 km',
    description:
      'Confort, silencio y la tecnología más avanzada. Un salón sobre ruedas para quien lo quiere todo.',
    features: ['Confort y silencio superiores', 'Tecnología de vanguardia', 'Lujo eléctrico sin concesiones'],
  },
};

// Cada opción: p = carro que suma +2, s = carro que suma +1
const o = (label, p, s) => ({ label, p, s });

const QUESTIONS = [
  {
    text: '¿Cómo es tu día a día?',
    options: [
      o('Entre la ciudad y la oficina, siempre bien presentado', 'carro1', 'carro5'),
      o('Moviéndome entre trabajo, familia y mil pendientes', 'carro2', 'carro1'),
      o('Cualquier camino es bueno, hasta los que no están pavimentados', 'carro3', 'carro4'),
      o('Buscando cualquier excusa para manejar', 'carro4', 'carro3'),
    ],
  },
  {
    text: '¿Cuál es tu plan ideal de fin de semana?',
    options: [
      o('Una cena elegante con buena compañía', 'carro5', 'carro1'),
      o('Una escapada en familia a la playa o a la montaña', 'carro2', 'carro3'),
      o('Aventura en la naturaleza, lejos del asfalto', 'carro3', 'carro2'),
      o('Una ruta de carretera con parada en un lugar con vista', 'carro4', 'carro1'),
    ],
  },
  {
    text: '¿Qué es lo que más valoras en un auto?',
    options: [
      o('Silencio y confort absoluto', 'carro5', 'carro1'),
      o('Equilibrio: práctico, cómodo y bien equipado', 'carro2', 'carro1'),
      o('Robustez y capacidad para todo terreno', 'carro3', 'carro2'),
      o('Diseño llamativo y potencia', 'carro4', 'carro3'),
    ],
  },
  {
    text: '¿Qué tanto te importa la tecnología a bordo?',
    options: [
      o('Quiero lo más avanzado que exista', 'carro5', 'carro1'),
      o('Me gusta lo útil y bien integrado', 'carro1', 'carro2'),
      o('Prefiero controles simples y directos', 'carro3', 'carro2'),
      o('Que la tecnología sume a la experiencia de manejo', 'carro4', 'carro5'),
    ],
  },
  {
    text: '¿Quién te acompaña normalmente?',
    options: [
      o('Casi siempre voy solo/a', 'carro4', 'carro1'),
      o('Mi pareja o socios', 'carro1', 'carro5'),
      o('Mi familia, a veces con mascotas y equipaje', 'carro2', 'carro3'),
      o('Amigos y planes con aventura', 'carro3', 'carro4'),
    ],
  },
  {
    text: '¿Cómo son tus recorridos más comunes?',
    options: [
      o('Casi todo ciudad, con tráfico y paradas', 'carro1', 'carro5'),
      o('Mezcla de ciudad y carretera', 'carro2', 'carro1'),
      o('Carreteras largas y terrenos variados', 'carro3', 'carro2'),
      o('Autopistas largas, viajando cómodo y sin cansarme', 'carro5', 'carro4'),
    ],
  },
  {
    text: '¿Qué tan importante es la sostenibilidad para ti?',
    options: [
      o('Muy importante, quiero cero emisiones', 'carro5', 'carro1'),
      o('Busco eficiencia, pero sin renunciar al espacio', 'carro2', 'carro1'),
      o('Prefiero capacidad y robustez antes que eficiencia', 'carro3', 'carro2'),
      o('Prefiero carácter y desempeño antes que consumo', 'carro4', 'carro3'),
    ],
  },
  {
    text: '¿Qué frase describe mejor el auto que buscas?',
    options: [
      o('"El futuro ya llegó"', 'carro5', 'carro1'),
      o('"Todo lo que necesito, en un solo auto"', 'carro2', 'carro1'),
      o('"Un ícono que no pasa de moda"', 'carro3', 'carro4'),
      o('"Llegué y se notó"', 'carro4', 'carro5'),
    ],
  },
  {
    text: '¿Cómo imaginas el interior de tu auto?',
    options: [
      o('Sobrio y elegante, con tecnología bien integrada', 'carro1', 'carro5'),
      o('Amplio, versátil y fácil de usar', 'carro2', 'carro1'),
      o('Robusto, con carácter y presencia', 'carro3', 'carro4'),
      o('Lujo total, como un salón sobre ruedas', 'carro5', 'carro1'),
    ],
  },
  {
    text: 'Cuando lo ves parqueado en la calle, ¿qué quieres que piensen?',
    options: [
      o('"Qué clase y elegancia"', 'carro1', 'carro5'),
      o('"Qué práctico y bien pensado"', 'carro2', 'carro1'),
      o('"Qué imponente"', 'carro3', 'carro4'),
      o('"Qué diseño tan impactante"', 'carro4', 'carro5'),
    ],
  },
];

// Textos dinámicos de la interfaz (el copy estático de Inicio vive en el HTML para verse sin JS)
const TEXTS = {
  exitConfirm: 'Si sales ahora perderás tus respuestas del test. ¿Quieres salir?',
  backToHome: 'Volver al inicio',
  back: 'Volver a la pregunta anterior',
  keyboardHint: 'Usa las flechas para elegir una opción y Enter para continuar.',
  progress: (n, total) => `Pregunta ${n} de ${total}`,
  affinityLabel: 'Tu match ideal',
  // affinity: (pct) => `${pct}% afín`, // porcentaje oculto por decisión de diseño; el cálculo sigue interno
  errors: {
    name: 'Escribe tu nombre completo.',
    phone: 'Escribe un teléfono válido (mínimo 8 dígitos).',
    emailEmpty: 'Escribe tu correo electrónico.',
    emailInvalid: 'Revisa el formato del correo (ej. nombre@correo.com).',
    consent: 'Debes aceptar el tratamiento de tus datos para continuar.',
  },
  submit: { idle: 'Quiero que un asesor me contacte', loading: 'Enviando…' },
  success: 'Gracias. Un asesor te contactará muy pronto.',
  sendError: 'No pudimos enviar tus datos. Intenta de nuevo.',
};

window.MB = window.MB || {};
MB.config = { CONFIG, CARS, QUESTIONS, TEXTS };
})();
