// Genera el guion de exposición (notas del orador) en un .docx para compartir.
const GLOBAL = require('child_process').execSync('npm root -g').toString().trim();
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat
} = require(GLOBAL + '/docx');
const fs = require('fs');

const BLUE = "0070C0";

// --- reparto de expositores ---
const dist = [
  ["Matías Arriagada (Director)", "L1, L12", "~1,5 min"],
  ["Pedro Faúndez (Jefe de Proyecto)", "L2, L4", "~1,5 min"],
  ["Alejandro Uribe (Arquitecto)", "L3, L5", "~1,5 min"],
  ["Bryan Alfaro (QA)", "L6, L7", "~1,5 min"],
  ["Jeremy Hernández (Programador)", "L10", "~50 s"],
  ["Vicente Riquelme (Programador)", "L8", "~45 s"],
  ["José Alarcón (Base de Datos)", "L11", "~45 s"],
  ["Bastián Pozo (ex director)", "L9", "~40 s"],
];

// --- guion por lámina: [n, titulo, expositor, tiempo, texto] ---
const guion = [
  [1, "Portada", "Matías Arriagada", "~30 s",
   "Buenas tardes. Somos el Grupo Verde. Presentamos el reporte de ejecución, monitoreo y control de nuestro proyecto: un sistema de gestión de inventario para botillería. En los próximos 10 minutos verán el estado del proyecto, las desviaciones respecto del plan, cómo gestionamos los cambios y los riesgos, y nuestra recomendación sobre el cierre."],
  [2, "Estado general del proyecto", "Pedro Faúndez", "~50 s",
   "El proyecto tiene un avance global cercano al 80%. Lo medimos por hitos ponderados según esfuerzo: están completados los hitos H-0 a H-3, que incluyen el diseño y el desarrollo e integración, que es el de mayor peso. En curso están las pruebas (H-4), el manual (H-5) y esta presentación (H-6). Estamos en la semana 13 de 15. El núcleo del alcance se cumplió; lo que se retrasó fueron las pruebas del lector, por una adquisición pendiente que explicaremos."],
  [3, "Variaciones: alcance y tiempo", "Alejandro Uribe", "~50 s",
   "En alcance tuvimos un cambio importante: pasamos de un sistema a medida instalado en el local de un cliente a un producto de inventario pensado para comercialización; por eso las pruebas las realiza el propio equipo. En tiempo hay un atraso en el hito de pruebas: la causa es que el lector de código de barras no se adquirió a tiempo. El impacto se acota a las pruebas del lector; el resto del MVP está operativo. La medida fue conseguir un lector en préstamo y mantener el ingreso manual como respaldo."],
  [4, "Variaciones: costos", "Pedro Faúndez", "~40 s",
   "En costos, el plan contemplaba 20 mil pesos, únicamente para el lector. A la fecha el costo ejecutado es cero, porque la compra está pendiente. Es importante aclarar que esa variación favorable no es un ahorro real: el costo se materializará al adquirir el equipo. Para las pruebas usamos un lector prestado, sin costo. El presupuesto se mantiene muy acotado y bajo control."],
  [5, "Gestión del alcance y cambios", "Alejandro Uribe", "~50 s",
   "Tuvimos dos cambios controlados. El primero, técnico: de un ejecutable de escritorio pasamos a una aplicación web local, por portabilidad y mantenibilidad. El segundo, de alcance: de una solución a medida a un producto para comercialización, lo que además corrige una inconsistencia que teníamos sobre el cliente. Ambos se evaluaron en equipo, los aprobó el director y se registraron. No hubo scope creep: fueron decisiones deliberadas y acotadas al MVP."],
  [6, "Gestión de riesgos: materializados", "Bryan Alfaro", "~50 s",
   "El principal riesgo que se materializó ya estaba en nuestro PMP: la no disponibilidad e integración del lector, con probabilidad baja pero impacto alto. Su impacto real fue el atraso de las pruebas de integración. La respuesta planificada, pruebas funcionales más respaldo manual, funcionó parcialmente: el sistema sigue operativo aun sin el lector, gracias al ingreso manual. No teníamos reserva de contingencia monetaria, así que la respuesta fue de gestión: conseguir el equipo en préstamo. Queda pendiente validar la integración."],
  [7, "Gestión de riesgos: nuevos y residuales", "Bryan Alfaro", "~45 s",
   "Durante la ejecución aparecieron dos riesgos nuevos. Uno: al cambiar a producto comercial, ya no hay un usuario real validando; lo cubrimos con validación del propio equipo y validación académica, y dejamos el usuario piloto para una etapa futura. Dos: el cambio de liderazgo, que tratamos con traspaso de contexto y roles definidos. Como riesgos residuales quedan la integración del lector sin validar al cien por ciento y la validación con usuario real; ambos acotados y con acción definida."],
  [8, "Partes interesadas y comunicaciones", "Vicente Riquelme", "~45 s",
   "En partes interesadas, el cambio principal es que el cliente específico sale del alcance al volvernos producto comercial. Los stakeholders clave ahora son el equipo, el docente y el ayudante como validadores, y el mercado potencial a futuro. El involucramiento del docente y del ayudante es alto y se concreta hoy. En comunicaciones, nuestro principal problema fue la continuidad por los cambios de liderazgo; lo corregimos con traspaso documentado y roles claros."],
  [9, "Gestión del equipo y recursos", "Bastián Pozo", "~40 s",
   "Sobre el equipo: el liderazgo del proyecto cambió durante el desarrollo; el director actual es Matías Arriagada y yo, como director inicial, quedé apoyando el traspaso de contexto. Los roles del PMP se mantienen: jefe de proyecto, arquitecto, QA, programadores y base de datos. El problema relevante fue la discontinuidad por el cambio de liderazgo y el recurso pendiente del lector; lo abordamos con apoyo cruzado y el lector en préstamo."],
  [10, "Toma de decisiones durante la ejecución", "Jeremy Hernández", "~50 s",
   "Las decisiones clave de la ejecución fueron cuatro. Migrar a aplicación web, por portabilidad. Redefinir el alcance a producto comercial. Usar un asistente de IA para acelerar el desarrollo, siendo transparentes: el equipo se concentró en los requisitos, la integración, la revisión y validación del código, las pruebas y la gestión. Y conseguir el lector en préstamo para no bloquear las pruebas. Como desafíos pendientes quedan validar el lector y obtener hoy su validación."],
  [11, "Lecciones aprendidas", "José Alarcón", "~45 s",
   "Aprendimos varias cosas. Que las adquisiciones, aunque sean baratas, deben gestionarse desde el inicio: un ítem de 20 mil pesos fue nuestro cuello de botella. Que el cambio de liderazgo exige traspaso documentado. Y que la IA acelera el desarrollo, pero exige que el equipo revise, valide y pruebe el código; no reemplaza nuestro criterio. Como recomendación: gestionar las compras temprano con una reserva de contingencia y validar tempranamente la salida de la IA con pruebas."],
  [12, "Conclusiones", "Javier Aguilar", "~60 s",
   "Para concluir: el desempeño global es bueno, con un MVP funcional operativo en entorno local y los objetivos centrales logrados. Sin embargo, nuestra conclusión es que el proyecto aún no está en condiciones de cerrarse, pero sí de avanzar hacia el cierre, sujeto a cuatro condiciones: validar la integración del lector, completar el documento de pruebas y el manual, y formalizar la aceptación en esta instancia. Los riesgos residuales son acotados y con acción definida, por lo que recomendamos cerrar una vez cumplidas esas condiciones. Muchas gracias."],
];

const qa = [
  "Si preguntan por el código / la IA: “Usamos un asistente de IA como herramienta de productividad para construir el MVP dentro del plazo. El trabajo del equipo se concentró en definir requisitos, integrar, revisar y validar el código, hacer las pruebas y gestionar el proyecto.”",
  "Si preguntan cómo miden el 80%: “Es un avance por hitos ponderados según esfuerzo; el desarrollo e integración (H-3), que es el de mayor peso, está completo.”",
  "Si preguntan por el cambio de alcance: “Fue una redefinición controlada y registrada: pasamos de una solución a medida a un producto comercializable; eso cambia el criterio de éxito de ‘aceptación de un cliente’ a ‘MVP funcional validado por el equipo’.”",
];

// ---------- helpers ----------
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
function tc(text, w, opts = {}) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: !!opts.bold,
      color: opts.color || "000000", size: 20 })] })]
  });
}

const children = [];

// título
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [new TextRun({ text: "Guion de Exposición — Trabajo #3", bold: true, size: 36, color: BLUE })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
  children: [new TextRun({ text: "Sistema de Gestión de Inventario para Botillería — MVP", size: 24 })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
  children: [new TextRun({ text: "Grupo Verde · IIG4701 Taller de Gestión de Proyectos · 16 de junio de 2026", size: 20, color: "595959" })] }));

children.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({
  text: "Duración objetivo: ~9–10 minutos. Cada integrante expone las láminas asignadas (la rúbrica exige participación equivalente). El guion es un APOYO: no leerlo textual, ya que la rúbrica penaliza la lectura excesiva de diapositivas.",
  italics: true, size: 20 })] }));

// tabla de reparto
children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 80 },
  children: [new TextRun({ text: "Reparto de expositores", bold: true, color: BLUE })] }));
const rows = [new TableRow({ tableHeader: true, children: [
  tc("Integrante", 4680, { bold: true, color: "FFFFFF", fill: BLUE }),
  tc("Láminas", 2340, { bold: true, color: "FFFFFF", fill: BLUE }),
  tc("Tiempo aprox.", 2340, { bold: true, color: "FFFFFF", fill: BLUE }),
] })];
dist.forEach(d => rows.push(new TableRow({ children: [
  tc(d[0], 4680), tc(d[1], 2340), tc(d[2], 2340)
] })));
children.push(new Table({ width: { size: 9360, type: WidthType.DXA },
  columnWidths: [4680, 2340, 2340], rows }));

// guion por lámina
children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 320, after: 80 },
  children: [new TextRun({ text: "Guion por lámina", bold: true, color: BLUE })] }));
guion.forEach(g => {
  children.push(new Paragraph({ spacing: { before: 200, after: 40 }, children: [
    new TextRun({ text: `Lámina ${g[0]} — ${g[1]}`, bold: true, size: 24 }),
  ] }));
  children.push(new Paragraph({ spacing: { after: 60 }, children: [
    new TextRun({ text: `Expositor: ${g[2]}   ·   ${g[3]}`, bold: true, color: BLUE, size: 20 }),
  ] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [
    new TextRun({ text: g[4], size: 22 }),
  ] }));
});

// preparación de preguntas
children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, pageBreakBefore: true, spacing: { after: 80 },
  children: [new TextRun({ text: "Preparación para preguntas (defensa)", bold: true, color: BLUE })] }));
qa.forEach(q => children.push(new Paragraph({
  numbering: { reference: "qa", level: 0 }, spacing: { after: 100 },
  children: [new TextRun({ text: q, size: 22 })] })));

children.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({
  text: "Consejo final: practicar una pasada cronometrada; mantener contacto visual; el que cierra (Matías) debe dejar clara la recomendación: avanzar hacia el cierre con las 4 condiciones cumplidas.",
  italics: true, size: 20, color: "595959" })] }));

const doc = new Document({
  styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
  numbering: { config: [{ reference: "qa", levels: [{ level: 0, format: LevelFormat.DECIMAL,
    text: "%1.", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 480, hanging: 360 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 },
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  const out = "C:/Users/matia/OneDrive/Escritorio/CLAUDE_PROJECT/TGP_Botilleria/Guion_Exposicion_Trabajo3.docx";
  fs.writeFileSync(out, buf);
  console.log("OK: " + out + " (" + buf.length + " bytes)");
});
