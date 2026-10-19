# Descubre tu Mercedes-Benz ideal

Test de afinidad de Mercedes-Benz Costa Rica. El usuario responde 10 preguntas, el sistema calcula qué modelo va mejor con su estilo y al final puede dejar sus datos para que un asesor lo contacte.

HTML, CSS y JavaScript puros, sin dependencias ni build.

## Cómo correrlo

Abrir `index.html` con doble clic, o servir la carpeta:

```bash
npx serve .
```

## Cómo funciona

1. **Inicio:** pasarela de modelos e historia de cada carro al hacer scroll.
2. **Test:** 10 preguntas con 4 opciones cada una.
3. **Match:** pantalla de transición.
4. **Resultado:** el carro ideal y un formulario de contacto (nombre, teléfono, correo y consentimiento).

Cada opción suma **+2** a un carro y **+1** a otro. Gana el que tenga más puntos. Desempate:

1. Más respuestas de +2.
2. Más puntos en las preguntas 6 a 10.
3. Orden fijo de los carros.

## Los carros

| Modelo | Perfil |
|---|---|
| **GLC Coupé** | El coupé elegante |
| **GLC SUV** | El versátil |
| **Clase G** | El ícono |
| **GLE Coupé** | El deportivo con estilo |
| **EQS Sedán** | El máximo lujo eléctrico |

## Las preguntas

1. **¿Cómo es tu día a día?**
   - Entre la ciudad y la oficina, siempre bien presentado
   - Moviéndome entre trabajo, familia y mil pendientes
   - Cualquier camino es bueno, hasta los que no están pavimentados
   - Buscando cualquier excusa para manejar

2. **¿Cuál es tu plan ideal de fin de semana?**
   - Una cena elegante con buena compañía
   - Una escapada en familia a la playa o a la montaña
   - Aventura en la naturaleza, lejos del asfalto
   - Una ruta de carretera con parada en un lugar con vista

3. **¿Qué es lo que más valoras en un auto?**
   - Silencio y confort absoluto
   - Equilibrio: práctico, cómodo y bien equipado
   - Robustez y capacidad para todo terreno
   - Diseño llamativo y potencia

4. **¿Qué tanto te importa la tecnología a bordo?**
   - Quiero lo más avanzado que exista
   - Me gusta lo útil y bien integrado
   - Prefiero controles simples y directos
   - Que la tecnología sume a la experiencia de manejo

5. **¿Quién te acompaña normalmente?**
   - Casi siempre voy solo/a
   - Mi pareja o socios
   - Mi familia, a veces con mascotas y equipaje
   - Amigos y planes con aventura

6. **¿Cómo son tus recorridos más comunes?**
   - Casi todo ciudad, con tráfico y paradas
   - Mezcla de ciudad y carretera
   - Carreteras largas y terrenos variados
   - Autopistas largas, viajando cómodo y sin cansarme

7. **¿Qué tan importante es la sostenibilidad para ti?**
   - Muy importante, quiero cero emisiones
   - Busco eficiencia, pero sin renunciar al espacio
   - Prefiero capacidad y robustez antes que eficiencia
   - Prefiero carácter y desempeño antes que consumo

8. **¿Qué frase describe mejor el auto que buscas?**
   - "El futuro ya llegó"
   - "Todo lo que necesito, en un solo auto"
   - "Un ícono que no pasa de moda"
   - "Llegué y se notó"

9. **¿Cómo imaginas el interior de tu auto?**
   - Sobrio y elegante, con tecnología bien integrada
   - Amplio, versátil y fácil de usar
   - Robusto, con carácter y presencia
   - Lujo total, como un salón sobre ruedas

10. **Cuando lo ves parqueado en la calle, ¿qué quieres que piensen?**
    - "Qué clase y elegancia"
    - "Qué práctico y bien pensado"
    - "Qué imponente"
    - "Qué diseño tan impactante"

## Estructura

```
index.html
css/   estilos por pantalla (tokens, base, header, inicio, loop, test, resultado, match)
js/    lógica por pantalla; config.js tiene carros, preguntas y textos
img/   fotos de los carros, logo e íconos
```

Para cambiar carros, preguntas, pesos o textos, editar `js/config.js`.

