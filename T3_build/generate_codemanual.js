// Genera un Manual del Código simple (.docx) para preparar la defensa.
const GLOBAL = require('child_process').execSync('npm root -g').toString().trim();
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType, LevelFormat
} = require(GLOBAL + '/docx');
const fs = require('fs');

const BLUE = "0070C0";
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, w, opts = {}) {
  const runs = (Array.isArray(text) ? text : [text]).map((t, i) =>
    new Paragraph({ children: [new TextRun({ text: t, bold: !!opts.bold,
      color: opts.color || "000000", size: opts.size || 20,
      font: opts.mono ? "Consolas" : "Arial" })] }));
  return new TableCell({ borders, width: { size: w, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: runs });
}
function headerRow(cols, widths) {
  return new TableRow({ tableHeader: true, children: cols.map((c, i) =>
    cell(c, widths[i], { bold: true, color: "FFFFFF", fill: BLUE })) });
}
function row(cols, widths, opts = []) {
  return new TableRow({ children: cols.map((c, i) =>
    cell(c, widths[i], opts[i] || {})) });
}
function makeTable(headers, rows, widths) {
  return new Table({ width: { size: widths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow(headers, widths), ...rows.map(r => row(r, widths))] });
}

const C = []; // children
function h1(t){ C.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{before:280,after:120},
  children:[new TextRun({text:t,bold:true,color:BLUE,size:28})] })); }
function h2(t){ C.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing:{before:200,after:80},
  children:[new TextRun({text:t,bold:true,color:BLUE,size:24})] })); }
function p(t,opts={}){ C.push(new Paragraph({ spacing:{after:opts.after||100},
  children:[new TextRun({text:t,size:opts.size||22,italics:!!opts.it,bold:!!opts.b,
  color:opts.color||"000000"})] })); }
function bullet(t){ C.push(new Paragraph({ numbering:{reference:"b",level:0}, spacing:{after:60},
  children:[new TextRun({text:t,size:22})] })); }
function num(t){ C.push(new Paragraph({ numbering:{reference:"n",level:0}, spacing:{after:60},
  children:[new TextRun({text:t,size:22})] })); }
function table(headers,rows,widths){ C.push(makeTable(headers,rows,widths));
  C.push(new Paragraph({spacing:{after:120},children:[new TextRun("")]})); }
function codeBlock(lines){
  const paras = lines.map(l => new Paragraph({ spacing:{after:0},
    children:[new TextRun({ text: l===""?" ":l, font:"Consolas", size:17 })] }));
  C.push(new Table({ width:{size:9360,type:WidthType.DXA}, columnWidths:[9360],
    rows:[ new TableRow({ children:[ new TableCell({ borders,
      shading:{fill:"F4F4F4",type:ShadingType.CLEAR},
      margins:{top:100,bottom:100,left:160,right:160},
      width:{size:9360,type:WidthType.DXA}, children: paras }) ] }) ] }));
  C.push(new Paragraph({spacing:{after:160},children:[new TextRun("")]})); }
function snippet(title, desc, lines){ h2(title); if(desc) p(desc); codeBlock(lines); }

// ---- Portada / intro ----
C.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing:{after:60},
  children:[new TextRun({text:"Manual del Código",bold:true,size:40,color:BLUE})] }));
C.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing:{after:40},
  children:[new TextRun({text:"Sistema de Gestión de Inventario para Botillería — MVP",size:24})] }));
C.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing:{after:240},
  children:[new TextRun({text:"Grupo Verde · IIG4701 · Guía simple para explicar el sistema",size:20,color:"595959"})] }));
p("Este manual explica, en lenguaje simple, cómo está construido el sistema: qué hace cada archivo, cómo funciona el backend y qué ocurre por dentro cuando se usa cada función de la pantalla. Sirve para responder con seguridad si preguntan cómo funciona.", {it:true});

// ---- 1. Stack ----
h1("1. ¿Qué es y con qué está hecho?");
p("El sistema tiene dos partes que trabajan juntas:");
bullet("Frontend (la interfaz): hecho con React + Vite. Es lo que se ve en el navegador (puerto 5173).");
bullet("Backend (el servidor / API): hecho con Node.js + Express. Recibe las peticiones y responde con datos (puerto 3001).");
bullet("Base de datos: SQLite, usando el módulo nativo de Node \"node:sqlite\". Guarda todo en un archivo local llamado botilleria.db (no necesita internet ni instalar programas extra).");
p("Idea clave: la interfaz NO toca la base de datos directamente. Le pide los datos al backend a través de direcciones que empiezan con /api, y el backend es el único que lee y escribe en la base de datos.", {b:true});

// ---- 2. Cómo se ejecuta ----
h1("2. ¿Cómo se ejecuta?");
num("Se ejecuta el archivo INSTALAR_Y_EJECUTAR.bat (instala todo la primera vez) o EJECUTAR.bat.");
num("El comando npm run dev levanta al mismo tiempo el servidor (backend) y la interfaz (frontend).");
num("Se abre el navegador en http://localhost:5173 y la aplicación ya está funcionando.");

// ---- 3. Flujo ----
h1("3. ¿Cómo se comunican? (flujo general)");
p("Cada vez que el usuario hace algo en la pantalla, ocurre esta cadena:");
p("Navegador (React)  →  llama a una dirección /api/...  →  Vite la redirige al backend  →  Express (puerto 3001)  →  consulta la base de datos SQLite  →  devuelve la respuesta en formato JSON  →  React actualiza lo que se ve en pantalla.", {b:true});

// ---- 4. Backend ----
h1("4. Backend — archivo por archivo");

h2("server/index.js — el que enciende el servidor");
p("Arranca el servidor Express en el puerto 3001, conecta las rutas (productos, movimientos, categorías), habilita CORS (permite que la interfaz se conecte) y ofrece un \"health check\" para saber si el servidor está vivo.");

h2("server/database.js — la base de datos");
p("Abre (o crea) el archivo botilleria.db, crea las 3 tablas si no existen y carga 10 categorías por defecto la primera vez (Cerveza, Vino, Pisco, etc.). Exporta la conexión para que las rutas la usen.");

h2("server/routes/products.js — productos e inventario");
table(["Método","Dirección","Qué hace"],[
  ["GET","/api/products","Lista los productos. Acepta filtros: search (texto), category, alerts=1 (solo stock bajo)."],
  ["GET","/api/products/barcode/:code","Busca un producto por su código de barras (lo usa el lector)."],
  ["GET","/api/products/:id","Devuelve un producto por su número (id)."],
  ["POST","/api/products","Crea un producto nuevo. Si tiene stock inicial, registra una entrada."],
  ["PUT","/api/products/:id","Edita los datos del producto (no cambia el stock)."],
  ["DELETE","/api/products/:id","Elimina \"suave\": marca active=0, no borra el historial."],
  ["GET","/api/products/stats/summary","Resumen del Dashboard: total, stock bajo, sin stock y valor del inventario."],
],[1100,3760,4500]);

h2("server/routes/transactions.js — movimientos de stock");
p("Registra cada movimiento y actualiza el stock del producto. Hay 4 tipos: entrada (suma), salida y venta (restan) y ajuste (fija el stock en un valor exacto). El registro del movimiento y la actualización del stock se hacen juntos como una sola operación (transacción atómica), para que nunca queden datos a medias.");
table(["Método","Dirección","Qué hace"],[
  ["GET","/api/transactions","Lista el historial. Filtros: product_id, type, limit."],
  ["POST","/api/transactions","Registra un movimiento y actualiza el stock. Valida que haya stock suficiente."],
],[1100,3760,4500]);

h2("server/routes/categories.js — categorías");
table(["Método","Dirección","Qué hace"],[
  ["GET","/api/categories","Lista las categorías (para el menú desplegable)."],
  ["POST","/api/categories","Crea una categoría nueva (el nombre no se puede repetir)."],
],[1100,3760,4500]);

// ---- 5. Base de datos ----
h1("5. La base de datos (3 tablas)");
table(["Tabla","Para qué sirve","Columnas importantes"],[
  ["categories","Clasificar los productos.","id, name (nombre único)"],
  ["products","El catálogo de productos.","barcode (código), name, category_id, brand (marca), unit (unidad), cost_price (costo), sale_price (venta), stock, min_stock (mínimo para alerta), location (ubicación), active (1=activo, 0=eliminado)"],
  ["transactions","El historial de movimientos.","product_id, type (entrada/salida/ajuste/venta), quantity (cantidad), unit_price, notes, created_at (fecha)"],
],[1700,2600,5060]);
p("Tres conceptos clave:", {b:true});
bullet("stock: cuántas unidades hay ahora. min_stock: si el stock baja a ese número o menos, aparece la alerta.");
bullet("active: cuando se \"elimina\" un producto no se borra de verdad; solo se marca active=0, así no se pierde el historial.");
bullet("type en transactions: define si el movimiento suma, resta o fija el stock.");

// ---- 6. Frontend ----
h1("6. Frontend — archivo por archivo");
table(["Archivo","Qué hace"],[
  ["client/src/api.js","Cliente que llama al backend. Reúne todas las funciones (getProducts, createProduct, createTransaction, etc.)."],
  ["client/src/hooks/useBarcode.js","Detecta el lector USB: como escribe muy rápido y termina con Enter, distingue el escaneo del tecleo normal."],
  ["client/src/hooks/useToast.js","Muestra mensajes temporales de éxito, error o advertencia."],
  ["client/src/App.jsx","Estructura general: menú lateral, indicador de conexión y las 4 páginas (Dashboard, Inventario, Alertas, Movimientos)."],
  ["components/Dashboard.jsx","Página de resumen: tarjetas con estadísticas, alertas y últimos movimientos."],
  ["components/ProductList.jsx","Inventario: tabla de productos, búsqueda, filtros y el área del lector de código."],
  ["components/ProductForm.jsx","Formulario para crear o editar un producto."],
  ["components/TransactionModal.jsx","Ventana para registrar un movimiento de stock (muestra el stock resultante antes de confirmar)."],
  ["components/StockAlerts.jsx","Lista de productos con stock bajo o agotado, con botón de \"Reponer\"."],
  ["components/TransactionHistory.jsx","Historial completo de movimientos, con filtros."],
  ["components/Toast.jsx","Dibuja en pantalla las notificaciones."],
],[3400,5960]);

// ---- 7. Funciones de la interfaz ----
h1("7. Funciones que se ven en pantalla (qué hace cada una por dentro)");
table(["Lo que hace el usuario","Qué pasa por dentro"],[
  ["Buscar un producto","Pide GET /api/products?search=... y muestra los resultados."],
  ["Filtrar por categoría","Pide GET /api/products?category=... ."],
  ["Escanear con la pistola","useBarcode detecta el código y pide GET /api/products/barcode/:code; si existe, lo muestra."],
  ["Crear \"Nuevo producto\"","Envía POST /api/products con los datos del formulario."],
  ["Editar un producto","Envía PUT /api/products/:id ."],
  ["Eliminar un producto","Envía DELETE /api/products/:id (marca active=0, no borra el historial)."],
  ["Mover stock (entrada/salida/venta/ajuste)","Envía POST /api/transactions; el backend actualiza el stock."],
  ["Reponer (en Alertas)","Abre la ventana de movimiento y registra una entrada."],
  ["Ver alertas de stock","Pide GET /api/products?alerts=1 (solo los que están en o bajo el mínimo)."],
  ["Ver movimientos","Pide GET /api/transactions con los filtros elegidos."],
  ["Abrir el Dashboard","Pide el resumen, las alertas y los últimos movimientos a la vez."],
],[3600,5760]);

// ---- 8. Ejemplo de flujo ----
h1("8. Ejemplo completo: registrar una venta");
num("El usuario abre el inventario y elige un producto (o lo escanea con la pistola).");
num("Pulsa \"Mover stock\", elige el tipo \"Venta\" y escribe la cantidad.");
num("La pantalla muestra de inmediato cómo quedaría el stock (verde, amarillo si queda bajo, rojo si no alcanza).");
num("Al confirmar, la interfaz envía POST /api/transactions al backend.");
num("El backend revisa que haya stock suficiente, guarda el movimiento y descuenta el stock en una sola operación.");
num("Devuelve el producto actualizado y la pantalla refleja el nuevo stock; si quedó bajo el mínimo, aparece en Alertas.");

// ---- 9. Fragmentos de código clave ----
h1("9. Fragmentos de código clave (con explicación)");
p("Estos son los trozos de código más importantes del sistema, por si piden ver código concreto. Cada uno está simplificado para enfocar la idea.", {it:true});

p("BACKEND", {b:true, color:BLUE});

snippet("9.1 Conexión a la base de datos y creación de tablas  (server/database.js)",
  "Abre el archivo SQLite con el módulo nativo de Node y crea la tabla de productos si no existe.",
  [
  "const { DatabaseSync } = require('node:sqlite');",
  "const db = new DatabaseSync(DB_PATH);   // archivo botilleria.db",
  "db.exec('PRAGMA foreign_keys = ON');    // activa claves foráneas",
  "",
  "db.exec(`",
  "  CREATE TABLE IF NOT EXISTS products (",
  "    id        INTEGER PRIMARY KEY AUTOINCREMENT,",
  "    barcode   TEXT UNIQUE,",
  "    name      TEXT NOT NULL,",
  "    stock     INTEGER NOT NULL DEFAULT 0,",
  "    min_stock INTEGER NOT NULL DEFAULT 5,   -- umbral de alerta",
  "    active    INTEGER NOT NULL DEFAULT 1    -- 0 = eliminado (borrado suave)",
  "  );",
  "`);",
  ]);

snippet("9.2 Registrar un movimiento y actualizar el stock  (server/routes/transactions.js)",
  "Es la lógica central: calcula el nuevo stock según el tipo y guarda el movimiento y el stock JUNTOS (transacción atómica), validando que no quede negativo.",
  [
  "let newStock;",
  "if (type === 'ajuste')       newStock = qty;            // fija el valor exacto",
  "else if (type === 'entrada') newStock = product.stock + qty;",
  "else {                       // salida o venta",
  "  newStock = product.stock - qty;",
  "  if (newStock < 0)",
  "    return res.status(400).json({ error: 'Stock insuficiente' });",
  "}",
  "",
  "try {",
  "  db.exec('BEGIN');                        // inicia la transacción",
  "  db.prepare('INSERT INTO transactions (product_id, type, quantity) " ,
  "             VALUES (?, ?, ?)').run(product_id, type, qty);",
  "  db.prepare('UPDATE products SET stock = ? WHERE id = ?')",
  "    .run(newStock, product_id);",
  "  db.exec('COMMIT');                       // confirma ambos cambios juntos",
  "} catch (err) {",
  "  db.exec('ROLLBACK');                     // si algo falla, no guarda nada",
  "}",
  ]);

snippet("9.3 Buscar productos con filtros  (server/routes/products.js)",
  "Arma la consulta SQL de forma segura (con ? para evitar inyección) según los filtros recibidos.",
  [
  "let query = `SELECT * FROM products WHERE active = 1`;",
  "const params = [];",
  "if (search) {",
  "  query += ` AND (name LIKE ? OR barcode LIKE ? OR brand LIKE ?)`;",
  "  const like = `%${search}%`;",
  "  params.push(like, like, like);",
  "}",
  "if (alerts === '1') query += ` AND stock <= min_stock`;  // solo stock bajo",
  "const products = db.prepare(query).all(...params);",
  ]);

p("FRONTEND", {b:true, color:BLUE});

snippet("9.4 Detección del lector de código de barras  (client/src/hooks/useBarcode.js)",
  "La pistola escribe muy rápido y termina con Enter. Si entre teclas pasa poco tiempo, es un escaneo; si pasa mucho, es tecleo manual.",
  [
  "const handleKey = (e) => {",
  "  const now = Date.now();",
  "  const timeSinceLast = now - lastKeyTime.current;",
  "  lastKeyTime.current = now;",
  "",
  "  if (e.key === 'Enter') { flush(); return; }   // fin del código",
  "",
  "  // Si pasó mucho tiempo entre teclas, era tecleo manual: reiniciar",
  "  if (timeSinceLast > 100 && buffer.current.length > 0)",
  "    buffer.current = '';",
  "",
  "  if (e.key.length === 1) buffer.current += e.key;  // acumula el carácter",
  "};",
  ]);

snippet("9.5 Cómo la interfaz llama al backend  (client/src/api.js)",
  "Una sola función envía las peticiones; si el backend responde error, lanza el mensaje para mostrarlo en pantalla.",
  [
  "async function request(path, options = {}) {",
  "  const res = await fetch(`/api${path}`, {",
  "    headers: { 'Content-Type': 'application/json' },",
  "    ...options,",
  "    body: options.body ? JSON.stringify(options.body) : undefined",
  "  });",
  "  const data = await res.json();",
  "  if (!res.ok) throw new Error(data.error || 'Error');",
  "  return data;",
  "}",
  "",
  "// Ejemplos de uso:",
  "api.getProducts({ search: 'cerveza' });",
  "api.createTransaction({ product_id: 5, type: 'venta', quantity: 2 });",
  ]);

snippet("9.6 Vista previa del stock resultante  (client/src/components/TransactionModal.jsx)",
  "Antes de confirmar, calcula y muestra cómo quedaría el stock, con color según el resultado.",
  [
  "const newStock =",
  "    type === 'ajuste'  ? qty",
  "  : type === 'entrada' ? product.stock + qty",
  "  :                      product.stock - qty;   // salida o venta",
  "",
  "// Rojo si queda negativo, amarillo si <= mínimo, verde si está bien",
  ]);

// ---- 10. Preguntas típicas ----
h1("10. Preguntas típicas y respuestas (defensa)");
const qa = [
  ["¿Dónde se guardan los datos?","En una base de datos SQLite local (archivo botilleria.db). Funciona sin internet."],
  ["¿Cómo funciona el lector de código de barras?","La pistola actúa como un teclado: escribe los números muy rápido y termina con Enter. Un \"hook\" detecta esa velocidad y reconoce que fue un escaneo."],
  ["¿Cómo evitan que el stock quede negativo?","Antes de descontar, el backend valida que haya stock suficiente; si no, rechaza el movimiento."],
  ["¿Por qué usaron node:sqlite y no otra librería?","Viene incluido en Node.js (versión 22+), no requiere compilar ni instalar nada extra, lo que simplifica la instalación en el computador del local."],
  ["¿Cómo se asegura que el movimiento y el stock queden consistentes?","Se guardan juntos como una transacción atómica (BEGIN/COMMIT): o se hacen las dos cosas o ninguna."],
  ["¿Qué pasa si se elimina un producto?","Se hace un borrado \"suave\" (active=0): desaparece de las listas pero se conserva su historial."],
  ["¿Qué pasa si no hay lector?","El sistema permite buscar e ingresar productos de forma manual; el lector es un apoyo, no un requisito."],
];
qa.forEach(x => {
  C.push(new Paragraph({ spacing:{before:120,after:20}, children:[
    new TextRun({text:"• "+x[0], bold:true, size:22, color:BLUE})] }));
  C.push(new Paragraph({ spacing:{after:60}, children:[new TextRun({text:x[1],size:22})] }));
});

const doc = new Document({
  styles:{ default:{ document:{ run:{ font:"Arial", size:22 } } },
    paragraphStyles:[
      {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:28,bold:true,color:BLUE,font:"Arial"},paragraph:{spacing:{before:280,after:120},outlineLevel:0}},
      {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:24,bold:true,color:BLUE,font:"Arial"},paragraph:{spacing:{before:200,after:80},outlineLevel:1}},
    ]},
  numbering:{ config:[
    {reference:"b",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:480,hanging:300}}}}]},
    {reference:"n",levels:[{level:0,format:LevelFormat.DECIMAL,text:"%1.",alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:480,hanging:360}}}}]},
  ]},
  sections:[{ properties:{ page:{ size:{width:12240,height:15840},
    margin:{top:1440,right:1440,bottom:1440,left:1440} } }, children:C }]
});

Packer.toBuffer(doc).then(buf=>{
  const out="C:/Users/matia/OneDrive/Escritorio/CLAUDE_PROJECT/TGP_Botilleria/Manual_Codigo_TGP_Botilleria.docx";
  fs.writeFileSync(out,buf);
  console.log("OK: "+out+" ("+buf.length+" bytes)");
});
