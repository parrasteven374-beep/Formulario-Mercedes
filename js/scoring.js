(function () {
  const { CONFIG, CARS, QUESTIONS } = MB.config;
  const CAR_IDS = Object.keys(CARS);

  // choices: índices de opción (0-3), uno por pregunta.
  // Desempate: 1) más respuestas de +2, 2) más puntos en preguntas 6-10, 3) orden de id (determinista).
  function computeResult(choices) {
    const stats = Object.fromEntries(CAR_IDS.map((id) => [id, { total: 0, primaries: 0, late: 0 }]));

    choices.forEach((choiceIndex, qi) => {
      const opt = QUESTIONS[qi].options[choiceIndex];
      const late = qi >= CONFIG.TIEBREAK_FROM_INDEX;
      stats[opt.p].total += CONFIG.POINTS_PRIMARY;
      stats[opt.p].primaries += 1;
      stats[opt.s].total += CONFIG.POINTS_SECONDARY;
      if (late) {
        stats[opt.p].late += CONFIG.POINTS_PRIMARY;
        stats[opt.s].late += CONFIG.POINTS_SECONDARY;
      }
    });

    const winnerId = [...CAR_IDS].sort(
      (a, b) =>
        stats[b].total - stats[a].total ||
        stats[b].primaries - stats[a].primaries ||
        stats[b].late - stats[a].late ||
        CAR_IDS.indexOf(a) - CAR_IDS.indexOf(b)
    )[0];

    // Uso interno (no se muestra en pantalla): puntaje del ganador sobre el máximo posible (todas con +2)
    const maxScore = QUESTIONS.length * CONFIG.POINTS_PRIMARY;
    const affinity = Math.round((stats[winnerId].total / maxScore) * 100);

    return { winnerId, affinity, stats };
  }

  // Solo pruebas: recorre las 4^10 combinaciones y cuenta victorias por carro.
  function simulateAll() {
    const n = QUESTIONS.length;
    const wins = Object.fromEntries(CAR_IDS.map((id) => [id, 0]));
    const choices = new Array(n).fill(0);
    const total = 4 ** n;
    for (let i = 0; i < total; i++) {
      let x = i;
      for (let q = 0; q < n; q++) { choices[q] = x & 3; x >>= 2; }
      wins[computeResult(choices).winnerId]++;
    }
    const table = Object.fromEntries(
      CAR_IDS.map((id) => [CARS[id].name, { victorias: wins[id], porcentaje: ((wins[id] / total) * 100).toFixed(1) + '%' }])
    );
    console.info(`simulateAll: ${total} combinaciones`);
    console.table(table);
    return wins;
  }

  MB.scoring = { computeResult, simulateAll };
})();
