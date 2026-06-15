# -*- coding: utf-8 -*-
"""Genera el deck del Trabajo 3 duplicando la lamina de la plantilla IIG4701."""
import os, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
UNP = os.path.join(BASE, "unpacked")
SLIDES = os.path.join(UNP, "ppt", "slides")
RELS = os.path.join(SLIDES, "_rels")

NAMES = "Arriagada · Faúndez · Uribe · Alfaro · Hernández · Riquelme · Alarcón"
BLUE = "0070C0"
TBL_STYLE = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"

def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))

# ---------- runs / paragraphs ----------
def run(text, sz=1100, b=0, color=None, italic=0, font="Arial"):
    fill = '<a:solidFill><a:srgbClr val="%s"/></a:solidFill>' % color if color else \
           '<a:solidFill><a:schemeClr val="tx1"/></a:solidFill>'
    return ('<a:r><a:rPr lang="es-CL" sz="%d" b="%d" i="%d" dirty="0">%s'
            '<a:latin typeface="%s"/><a:cs typeface="%s"/></a:rPr>'
            '<a:t>%s</a:t></a:r>') % (sz, b, italic, fill, font, font, esc(text))

def para(text, sz=1100, b=0, color=None, bullet=None, lvl=0, spc=400, align="l",
         italic=0, font="Arial"):
    if bullet is None:
        marL, indent, bu = 0, 0, "<a:buNone/>"
    else:
        marL = 285750 + lvl * 285750
        indent = -228600
        ch = "–" if lvl > 0 else "•"
        bu = ('<a:buFont typeface="Arial"/><a:buChar char="%s"/>' % ch)
    pPr = ('<a:pPr marL="%d" indent="%d" lvl="%d" algn="%s">'
           '<a:spcBef><a:spcPts val="%d"/></a:spcBef>%s</a:pPr>') % (
           marL, indent, lvl, align, spc, bu)
    return "<a:p>%s%s</a:p>" % (pPr, run(text, sz, b, color, italic, font))

def textbox(sid, name, x, y, cx, cy, paras, anchor="t"):
    return ('<p:sp><p:nvSpPr><p:cNvPr id="%d" name="%s"/><p:cNvSpPr txBox="1"/>'
            '<p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="%d" y="%d"/>'
            '<a:ext cx="%d" cy="%d"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/>'
            '</a:prstGeom><a:noFill/></p:spPr><p:txBody>'
            '<a:bodyPr wrap="square" lIns="36000" tIns="18000" rIns="36000" '
            'bIns="18000" rtlCol="0" anchor="%s"><a:normAutofit/></a:bodyPr>'
            '<a:lstStyle/>%s</p:txBody></p:sp>') % (
            sid, name, x, y, cx, cy, anchor, "".join(paras))

# ---------- tables ----------
def cell(text, sz=1000, b=0, color=None, fill=None, align="l", anchor="ctr",
         spc_lines=None):
    fillxml = '<a:solidFill><a:srgbClr val="%s"/></a:solidFill>' % fill if fill else ""
    border = ('<a:lnL w="6350"><a:solidFill><a:srgbClr val="BFBFBF"/></a:solidFill></a:lnL>'
              '<a:lnR w="6350"><a:solidFill><a:srgbClr val="BFBFBF"/></a:solidFill></a:lnR>'
              '<a:lnT w="6350"><a:solidFill><a:srgbClr val="BFBFBF"/></a:solidFill></a:lnT>'
              '<a:lnB w="6350"><a:solidFill><a:srgbClr val="BFBFBF"/></a:solidFill></a:lnB>')
    lines = text if isinstance(text, list) else [text]
    paras = "".join('<a:p><a:pPr algn="%s"/>%s</a:p>' % (align, run(t, sz, b, color))
                    for t in lines)
    return ('<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>%s</a:txBody>'
            '<a:tcPr marL="72000" marR="72000" marT="18000" marB="18000" anchor="%s">'
            '%s%s</a:tcPr></a:tc>') % (paras, anchor, border, fillxml)

def table(sid, x, y, col_w, rows, row_h=274320):
    grid = "".join('<a:gridCol w="%d"/>' % w for w in col_w)
    trs = ""
    for r in rows:
        trs += '<a:tr h="%d">%s</a:tr>' % (row_h, "".join(r))
    return ('<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="%d" name="Tabla%d"/>'
            '<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>'
            '<p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="%d" y="%d"/>'
            '<a:ext cx="%d" cy="%d"/></p:xfrm>'
            '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">'
            '<a:tbl><a:tblPr firstRow="1" bandRow="1"><a:tableStyleId>%s</a:tableStyleId></a:tblPr>'
            '<a:tblGrid>%s</a:tblGrid>%s</a:tbl></a:graphicData></a:graphic></p:graphicFrame>') % (
            sid, sid, x, y, sum(col_w), row_h * len(rows), TBL_STYLE, grid, trs)

def hrow(labels, col_w):
    return [cell(l, sz=1000, b=1, color="FFFFFF", fill=BLUE, align="l") for l in labels]

def drow(vals, aligns=None, fills=None):
    aligns = aligns or ["l"] * len(vals)
    fills = fills or [None] * len(vals)
    return [cell(v, sz=1000, align=a, fill=f) for v, a, f in zip(vals, aligns, fills)]

# ---------- frame (footer + title + slide number) ----------
def footer_table():
    cols = [792000, 2267832, 6084168]
    def fc(text, align):
        return ('<a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:pPr algn="%s"/>'
                '<a:r><a:rPr lang="es-CL" sz="900" b="1" dirty="0">'
                '<a:solidFill><a:schemeClr val="tx1"><a:lumMod val="50000"/>'
                '<a:lumOff val="50000"/></a:schemeClr></a:solidFill>'
                '<a:latin typeface="Aptos"/></a:rPr><a:t>%s</a:t></a:r></a:p></a:txBody>'
                '<a:tcPr marL="36000" marR="36000" marT="0" marB="0" anchor="ctr">'
                '<a:solidFill><a:schemeClr val="bg1"><a:lumMod val="85000"/></a:schemeClr>'
                '</a:solidFill></a:tcPr></a:tc>') % (align, esc(text))
    grid = "".join('<a:gridCol w="%d"/>' % w for w in cols)
    tr = '<a:tr h="258617">%s%s%s</a:tr>' % (
        fc("IIG4701", "r"), fc("Taller de Gestión de Proyectos", "l"),
        fc(NAMES, "ctr"))
    return ('<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="90" name="Footer"/>'
            '<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>'
            '<p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="0" y="4884027"/>'
            '<a:ext cx="9144000" cy="258617"/></p:xfrm>'
            '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">'
            '<a:tbl><a:tblPr firstRow="1" bandRow="1"><a:tableStyleId>%s</a:tableStyleId></a:tblPr>'
            '<a:tblGrid>%s</a:tblGrid>%s</a:tbl></a:graphicData></a:graphic></p:graphicFrame>') % (
            TBL_STYLE, grid, tr)

def slidenum():
    return ('<p:sp><p:nvSpPr><p:cNvPr id="91" name="SlideNum"/>'
            '<p:cNvSpPr txBox="1"><a:spLocks/></p:cNvSpPr><p:nvPr/></p:nvSpPr>'
            '<p:spPr><a:xfrm><a:off x="8845274" y="4893171"/><a:ext cx="298726" cy="259200"/>'
            '</a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>'
            '<p:txBody><a:bodyPr wrap="none" lIns="36000" tIns="36000" rIns="36000" '
            'bIns="36000" anchor="ctr" anchorCtr="1"><a:spAutoFit/></a:bodyPr>'
            '<a:lstStyle/><a:p><a:pPr algn="r"/>'
            '<a:fld id="{19422E07-F3AB-434B-B73D-CCEE95E66D37}" type="slidenum">'
            '<a:rPr lang="es-CL" sz="1000" b="1"><a:latin typeface="Arial"/></a:rPr>'
            '<a:t>1</a:t></a:fld></a:p></p:txBody></p:sp>')

def title_sp(text, sz=2000):
    return ('<p:sp><p:nvSpPr><p:cNvPr id="92" name="Titulo"/><p:cNvSpPr txBox="1"/>'
            '<p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="269083" y="233758"/>'
            '<a:ext cx="8336000" cy="430000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/>'
            '</a:prstGeom><a:noFill/></p:spPr><p:txBody>'
            '<a:bodyPr wrap="square" lIns="36000" tIns="0" rIns="36000" bIns="0" anchor="t">'
            '<a:normAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr algn="l"/>'
            '<a:r><a:rPr lang="es-CL" sz="%d" b="1" dirty="0">'
            '<a:solidFill><a:srgbClr val="%s"/></a:solidFill>'
            '<a:latin typeface="Montserrat"/><a:cs typeface="Arial"/></a:rPr>'
            '<a:t>%s</a:t></a:r></a:p></p:txBody></p:sp>') % (sz, BLUE, esc(text))

def slide_xml(shapes, with_title=None):
    head = ('<?xml version="1.0" encoding="utf-8"?>\n'
            '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
            'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/>'
            '<p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/>'
            '<a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm>'
            '</p:grpSpPr>')
    body = footer_table() + slidenum()
    if with_title is not None:
        body += title_sp(with_title)
    body += "".join(shapes)
    tail = ('</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>')
    return head + body + tail

# ====================== CONTENIDO ======================
CY_TOP = 760000
CW = 8336000
slides = []  # (title_or_None, [shapes])

# --- Slide 1: PORTADA ---
portada = [
    textbox(100, "big", 269083, 1500000, 8605834, 1400000, [
        para("Reporte de Ejecución, Monitoreo y Control",
             sz=3200, b=1, color=BLUE, align="ctr", font="Montserrat"),
        para("Sistema de Gestión de Inventario para Botillería Local — MVP",
             sz=1600, b=0, align="ctr", spc=600),
    ]),
    textbox(101, "sub", 269083, 3050000, 8605834, 1500000, [
        para("Trabajo #3  ·  IIG4701 Taller de Gestión de Proyectos  ·  16 de junio de 2026",
             sz=1100, b=1, align="ctr", color="595959"),
        para("Grupo Verde", sz=1200, b=1, align="ctr", color=BLUE, spc=500),
        para("Matías Arriagada (Director)  ·  Pedro Faúndez  ·  Alejandro Uribe  ·  Bryan Alfaro",
             sz=1050, align="ctr", spc=300),
        para("Jeremy Hernández  ·  Vicente Riquelme  ·  José Alarcón",
             sz=1050, align="ctr", spc=150),
    ]),
]
slides.append((None, portada))

# --- Slide 2: ESTADO GENERAL ---
cw2 = [3000000, 1500000, 3836000]
rows2 = [hrow(["Hito", "Estado", "Observación"], cw2)]
hitos = [
    ("H-0 Documento de Proyecto", "Completado", "Gestión, alcance y comunicación"),
    ("H-1 Diseño de Solución", "Completado", "Arquitectura y modelo de datos"),
    ("H-2 Plan de Adquisiciones", "Completado", "Plan definido; compra del lector pendiente"),
    ("H-3 Desarrollo e Integración", "Completado", "MVP funcional en entorno local"),
    ("H-4 Documento de Pruebas", "En curso", "Pruebas en ejecución"),
    ("H-5 Manual de Usuario", "En curso", "Borrador completo, en revisión"),
    ("H-6 Presentación Final", "En curso", "Esta presentación"),
]
for h, e, o in hitos:
    fill = "E2EFDA" if e == "Completado" else ("FFF2CC" if e in ("En curso", "Parcial") else None)
    rows2.append([cell(h, sz=1000, align="l"),
                  cell(e, sz=1000, b=1, align="ctr", fill=fill),
                  cell(o, sz=1000, align="l")])
s2 = [
    textbox(110, "avance", 269083, CY_TOP, CW, 470000, [
        para("Avance global ≈ 80%. Métrica: hitos ponderados por esfuerzo — H-0 a H-3 "
             "completados (incluye desarrollo e integración, de mayor peso); H-4, H-5 y "
             "H-6 en curso.", sz=1100, b=1, color=BLUE, spc=0),
    ]),
    table(111, 269083, 1270000, cw2, rows2, row_h=290000),
    textbox(112, "pve", 269083, 4470000, CW, 370000, [
        para("Plan vs. ejecutado: semana 13 de 15. El núcleo del alcance se cumplió; hubo un "
             "cambio de alcance (producto para comercialización) y se retrasaron las pruebas "
             "del lector por la adquisición pendiente.",
             sz=1000, italic=1, color="595959", spc=0),
    ]),
]
slides.append(("Estado general del proyecto", s2))

# --- Slide 3: VARIACIONES ALCANCE Y TIEMPO ---
cw3 = [1400000, 2600000, 2600000, 1736000]
rows3 = [hrow(["Dimensión", "Planificado (PMP)", "Ejecutado", "Variación"], cw3)]
rows3.append(drow(["Alcance",
                   "Sistema a medida instalado y validado en el local del cliente",
                   "Producto de inventario (MVP); pruebas realizadas por el equipo",
                   "Cambio de alcance (ver L5)"]))
rows3.append(drow(["Tiempo",
                   "15 semanas; pruebas en S12–S13",
                   "Semana 13; pruebas iniciadas con retraso",
                   "Atraso en H-4"]))
s3 = [
    table(120, 269083, CY_TOP, cw3, rows3, row_h=680000),
    textbox(121, "an", 269083, 2850000, CW, 1900000, [
        para("Análisis de las desviaciones", sz=1200, b=1, color=BLUE, spc=0),
        para("Causa: redefinición del alcance — de una solución a medida a un producto "
             "comercializable — y la adquisición del lector no concretada.", sz=1100, bullet=0),
        para("Impacto: ya no hay implementación ni validación en el local de un cliente; las "
             "pruebas las ejecuta el equipo (QA) y se desplazan las del lector (H-4).",
             sz=1100, bullet=0),
        para("Medidas: lector en préstamo para validar la integración (respaldo de ingreso "
             "manual disponible); pruebas y validación asumidas por el equipo.", sz=1100, bullet=0),
    ]),
]
slides.append(("Análisis de variaciones: alcance y tiempo", s3))

# --- Slide 4: VARIACIONES COSTOS ---
cw4 = [3936000, 1500000, 1500000, 1400000]
rows4 = [hrow(["Ítem", "Planificado", "Ejecutado", "Variación"], cw4)]
rows4.append(drow(["Lector de código de barras", "$20.000", "$0 (pendiente)", "–$20.000"],
                  aligns=["l", "ctr", "ctr", "ctr"]))
rows4.append(drow(["Computador local", "$0", "$0", "$0"], aligns=["l", "ctr", "ctr", "ctr"]))
rows4.append(drow(["Herramientas de desarrollo / SQLite", "$0", "$0", "$0"],
                  aligns=["l", "ctr", "ctr", "ctr"]))
rows4.append([cell("Total referencial", sz=1000, b=1, align="l", fill="D9E1F2"),
              cell("$20.000", sz=1000, b=1, align="ctr", fill="D9E1F2"),
              cell("$0", sz=1000, b=1, align="ctr", fill="D9E1F2"),
              cell("–$20.000", sz=1000, b=1, align="ctr", fill="D9E1F2")])
s4 = [
    table(130, 269083, CY_TOP, cw4, rows4, row_h=320000),
    textbox(131, "an4", 269083, 2550000, CW, 2100000, [
        para("Interpretación de la variación de costo", sz=1200, b=1, color=BLUE, spc=0),
        para("La variación es favorable solo en apariencia: NO representa un ahorro real, "
             "sino una adquisición aún no ejecutada.", sz=1100, bullet=0),
        para("El costo se materializará al adquirir el lector; para las pruebas se usa un "
             "equipo en préstamo (costo $0 para el proyecto).", sz=1100, bullet=0),
        para("El presupuesto del proyecto se mantiene muy acotado y bajo control "
             "(≤ $20.000 CLP).", sz=1100, bullet=0),
    ]),
]
slides.append(("Análisis de variaciones: costos", s4))

# --- Slide 5: GESTION DE CAMBIOS ---
cw5 = [2500000, 2400000, 2200000, 1236000]
rows5 = [hrow(["Cambio", "Justificación", "Impacto (plazo/costo/calidad)", "Control"], cw5)]
rows5.append(drow([
    "C1: Ejecutable de escritorio → aplicación web local",
    "Portabilidad, menor fricción de instalación y mejor mantenibilidad",
    "Plazo: neutro · Costo: $0 · Calidad: acceso desde navegador",
    "Evaluado por el equipo y aprobado por el director"]))
rows5.append(drow([
    "C2: De solución a medida (un cliente) a producto de inventario para comercialización",
    "Mayor valor y escalabilidad; corrige la inconsistencia inicial sobre el cliente",
    "Plazo: neutro · Costo: $0 · Calidad: + mercado, – validación de usuario real",
    "Cambio de alcance evaluado y registrado"]))
s5 = [
    table(140, 269083, CY_TOP, cw5, rows5, row_h=900000),
    textbox(141, "an5", 269083, 3680000, CW, 1100000, [
        para("Mecanismo de control de cambios", sz=1200, b=1, color=BLUE, spc=0),
        para("Ambos cambios fueron deliberados y acotados al MVP (sin scope creep no "
             "controlado): se evaluaron en equipo, los aprobó el director y se registraron "
             "como cambio de alcance. La redefinición ajusta el criterio de éxito: de la "
             "aceptación de un cliente a un MVP funcional validado por el equipo.", sz=1100, bullet=0),
    ]),
]
slides.append(("Gestión del alcance y cambios", s5))

# --- Slide 6: RIESGOS MATERIALIZADOS ---
cw6 = [2600000, 1700000, 1900000, 2136000]
rows6 = [hrow(["Riesgo materializado", "¿En el PMP?", "Impacto real", "Respuesta planificada"], cw6)]
rows6.append(drow([
    "No disponibilidad / integración del lector de código de barras",
    "Sí — Prob. Baja / Imp. Alto",
    "Atraso de las pruebas de integración (H-4)",
    "Pruebas funcionales + respaldo manual"]))
s6 = [
    table(150, 269083, CY_TOP, cw6, rows6, row_h=560000),
    textbox(151, "an6", 269083, 2050000, CW, 2650000, [
        para("Efectividad y análisis", sz=1200, b=1, color=BLUE, spc=0),
        para("Efectividad: parcial. El respaldo manual (ingreso y búsqueda manual) mantuvo "
             "operativo el sistema aun sin el lector.", sz=1100, bullet=0),
        para("El riesgo estaba identificado en el PMP, por lo que la respuesta no fue "
             "improvisada: el diseño no dependía exclusivamente del lector.", sz=1100, bullet=0),
        para("Reservas: el PMP no definió una reserva de contingencia monetaria; la "
             "respuesta fue de gestión (conseguir el equipo en préstamo), sin costo.",
             sz=1100, bullet=0),
        para("Acción pendiente: validar la integración del lector con el equipo en "
             "préstamo antes del cierre.", sz=1100, bullet=0),
    ]),
]
slides.append(("Gestión de riesgos: materializados", s6))

# --- Slide 7: RIESGOS NUEVOS Y RESIDUALES ---
cw7 = [2900000, 2400000, 3036000]
rows7 = [hrow(["Nuevo riesgo (en ejecución)", "Origen", "Tratamiento"], cw7)]
rows7.append(drow([
    "Ausencia de validación de un usuario / cliente real",
    "Cambio de alcance a producto comercial",
    "Validación por el equipo (QA) y validación académica; usuario piloto para una 2ª etapa"]))
rows7.append(drow([
    "Cambio de liderazgo del proyecto",
    "Gestión del equipo",
    "Traspaso de contexto del ex director, roles definidos y apoyo cruzado"]))
s7 = [
    table(160, 269083, CY_TOP, cw7, rows7, row_h=650000),
    textbox(161, "an7", 269083, 2880000, CW, 1850000, [
        para("Riesgos residuales y su tratamiento", sz=1200, b=1, color=BLUE, spc=0),
        para("Integración del lector no validada al 100% → se valida con el equipo en "
             "préstamo antes del cierre.", sz=1100, bullet=0),
        para("Validación con usuario real fuera del alcance actual → queda para una "
             "eventual etapa de comercialización.", sz=1100, bullet=0),
        para("Riesgos residuales acotados y con acción definida; no bloquean el avance "
             "hacia el cierre.", sz=1100, bullet=0),
    ]),
]
slides.append(("Gestión de riesgos: nuevos y residuales", s7))

# --- Slide 8: PARTES INTERESADAS Y COMUNICACIONES ---
s8 = [
    textbox(170, "pi", 269083, CY_TOP, 4100000, 3900000, [
        para("Cambios en las partes interesadas", sz=1200, b=1, color=BLUE, spc=0),
        para("El cliente específico (Botillería Jano) sale del alcance por el cambio a "
             "producto comercial.", sz=1100, bullet=0),
        para("Stakeholders clave ahora: el equipo (desarrolla y valida), el docente y "
             "ayudante (validación académica) y el mercado / clientes potenciales (futuro).",
             sz=1100, bullet=0),
        para("Involucramiento", sz=1200, b=1, color=BLUE, spc=400),
        para("Docente y ayudante: alto — validan el MVP en la sesión del 16/6.",
             sz=1100, bullet=0),
        para("Equipo: alto. Usuario / cliente real: sin participación en esta etapa.",
             sz=1100, bullet=0),
    ]),
    textbox(171, "com", 4500000, CY_TOP, 4105000, 3900000, [
        para("Comunicaciones", sz=1200, b=1, color=BLUE, spc=0),
        para("Plan interno basado en reuniones de coordinación y traspaso de contexto "
             "entre integrantes.", sz=1100, bullet=0),
        para("Problema principal: los cambios de liderazgo afectaron la continuidad de la "
             "comunicación.", sz=1100, bullet=0),
        para("Acción correctiva: traspaso documentado del ex director y roles claros "
             "para mantener el hilo del proyecto.", sz=1100, bullet=0),
        para("La validación se concreta con los stakeholders académicos en la sesión "
             "del 16/6.", sz=1100, bullet=0),
    ]),
]
slides.append(("Partes interesadas y comunicaciones", s8))

# --- Slide 9: EQUIPO Y RECURSOS ---
s9 = [
    textbox(180, "eq", 269083, CY_TOP, CW, 3900000, [
        para("Cambios en la conformación del equipo", sz=1200, b=1, color=BLUE, spc=0),
        para("El liderazgo del proyecto cambió dos veces durante su desarrollo; los "
             "directores anteriores ya no están en el equipo. Director actual: Matías Arriagada.",
             sz=1100, bullet=0),
        para("Roles vigentes (matriz del PMP): Jefe de Proyecto (Pedro), Arquitecto (Alejandro), "
             "QA (Bryan), Programadores (Jeremy / Vicente), Base de Datos (José).",
             sz=1100, bullet=0),
        para("Problemas relevantes", sz=1200, b=1, color=BLUE, spc=500),
        para("Discontinuidad por la rotación de liderazgo y un recurso pendiente "
             "(lector de código de barras).", sz=1100, bullet=0),
        para("Medidas adoptadas", sz=1200, b=1, color=BLUE, spc=500),
        para("Traspaso de contexto en cada cambio de dirección, apoyo cruzado entre "
             "integrantes y lector en préstamo para no detener las pruebas.", sz=1100, bullet=0),
    ]),
]
slides.append(("Gestión del equipo y recursos", s9))

# --- Slide 10: TOMA DE DECISIONES ---
cw10 = [3000000, 3000000, 2336000]
rows10 = [hrow(["Decisión", "Justificación", "Efecto en el desempeño"], cw10)]
for d, j, e in [
    ("Migrar a aplicación web local", "Portabilidad y mantenibilidad",
     "MVP accesible desde el navegador, sin instalador"),
    ("Redefinir el alcance a producto comercial", "Escalabilidad y valor; corrige inconsistencia del cliente",
     "Mayor alcance; la validación la asume el equipo"),
    ("Usar un asistente de IA en el desarrollo", "Cumplir el plazo; enfocar al equipo en requisitos, integración, pruebas y gestión",
     "Desarrollo más rápido; el rol del equipo se desplaza a revisión y QA"),
    ("Conseguir lector en préstamo", "No bloquear las pruebas (H-4)",
     "Permite validar la integración sin esperar la compra"),
    ("Priorizar el MVP", "Cumplir el plazo académico",
     "Funciones complementarias postergadas a una 2ª etapa"),
]:
    rows10.append(drow([d, j, e]))
s10 = [
    table(190, 269083, CY_TOP, cw10, rows10, row_h=470000),
    textbox(191, "dp", 269083, 3980000, CW, 760000, [
        para("Decisiones pendientes / desafíos críticos: validar la integración del "
             "lector y obtener la validación de los stakeholders académicos en la "
             "presentación del 16/6.", sz=1100, b=1, color="595959", spc=0),
    ]),
]
slides.append(("Toma de decisiones durante la ejecución", s10))

# --- Slide 11: LECCIONES APRENDIDAS ---
s11 = [
    textbox(200, "le", 269083, CY_TOP, CW, 3980000, [
        para("Error detectado: subestimamos la gestión de adquisiciones; un ítem de $20.000 "
             "(el lector) se volvió el cuello de botella de las pruebas. → Se abordó "
             "consiguiendo el equipo en préstamo.", sz=1050, bullet=0, spc=150),
        para("Error detectado: el cambio de liderazgo afectó la continuidad. → Se abordó "
             "con traspaso documentado en cada cambio de dirección y roles claros.", sz=1050, bullet=0, spc=150),
        para("Aprendizaje: el asistente de IA aceleró el desarrollo, pero exigió que el "
             "equipo revisara, validara y probara el código; la herramienta no reemplaza "
             "el criterio del equipo.", sz=1050, bullet=0, spc=150),
        para("Aprendizaje: definir tempranamente la arquitectura (web vs. escritorio) evita "
             "retrabajo; el respaldo manual (no depender solo del lector) fue una "
             "mitigación efectiva.", sz=1050, bullet=0, spc=150),
        para("Aprendizaje: acotar el alcance al MVP permitió avanzar dentro del plazo.",
             sz=1050, bullet=0, spc=150),
        para("Recomendaciones para etapas / proyectos futuros", sz=1100, b=1, color=BLUE, spc=350),
        para("Gestionar las adquisiciones desde el inicio, aun las de bajo costo, e incluir "
             "una reserva de contingencia.", sz=1050, bullet=0, lvl=1),
        para("Documentar el traspaso de roles y validar tempranamente la salida de IA con "
             "pruebas del equipo.", sz=1050, bullet=0, lvl=1),
    ]),
]
slides.append(("Lecciones aprendidas", s11))

# --- Slide 12: CONCLUSIONES ---
s12 = [
    textbox(210, "co", 269083, CY_TOP, CW, 3900000, [
        para("Desempeño global: avance ~80%, con un MVP funcional construido y operativo "
             "en entorno local.", sz=1150, bullet=0, spc=200),
        para("Cumplimiento de objetivos: registro de productos, control de stock, alertas y "
             "movimientos LOGRADOS; reportes básicos disponibles. Pendiente: validación del "
             "lector; la validación con un usuario real queda fuera del alcance actual.", sz=1150, bullet=0, spc=200),
        para("¿En condiciones de cierre?  Aún NO. El proyecto SÍ está en "
             "condiciones de AVANZAR HACIA el cierre, sujeto a:", sz=1150, b=1, color=BLUE,
             bullet=0, spc=300),
        para("Validar la integración del lector (equipo en préstamo).", sz=1100, bullet=0, lvl=1),
        para("Completar el Documento de Pruebas (H-4) y el Manual de Usuario (H-5).", sz=1100, bullet=0, lvl=1),
        para("Obtener la validación académica y formalizar la aceptación (H-6).", sz=1100, bullet=0, lvl=1),
        para("Los riesgos residuales son acotados y con acción definida → se recomienda "
             "cerrar una vez cumplidas estas condiciones.", sz=1150, bullet=0, spc=300),
    ]),
]
slides.append(("Conclusiones", s12))

# ====================== ESCRITURA ======================
for f in os.listdir(SLIDES):
    if f.endswith(".xml"):
        os.remove(os.path.join(SLIDES, f))
for f in os.listdir(RELS):
    os.remove(os.path.join(RELS, f))

N = len(slides)
for i, (title, shapes) in enumerate(slides, 1):
    with open(os.path.join(SLIDES, "slide%d.xml" % i), "w", encoding="utf-8") as fh:
        fh.write(slide_xml(shapes, with_title=title))
    with open(os.path.join(RELS, "slide%d.xml.rels" % i), "w", encoding="utf-8") as fh:
        fh.write('<?xml version="1.0" encoding="utf-8"?>\n'
                 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                 '<Relationship Id="rId1" '
                 'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" '
                 'Target="../slideLayouts/slideLayout1.xml"/></Relationships>')

# presentation.xml.rels
pr = ['<?xml version="1.0" encoding="utf-8"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>',
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="notesMasters/notesMaster1.xml"/>',
      '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/commentAuthors" Target="commentAuthors.xml"/>',
      '<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>',
      '<Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>',
      '<Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>',
      '<Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>']
for i in range(1, N + 1):
    pr.append('<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide%d.xml"/>' % (100 + i, i))
pr.append('</Relationships>')
with open(os.path.join(UNP, "ppt", "_rels", "presentation.xml.rels"), "w", encoding="utf-8") as fh:
    fh.write("".join(pr))

# presentation.xml — reemplazar sldIdLst
with open(os.path.join(UNP, "ppt", "presentation.xml"), encoding="utf-8") as fh:
    pres = fh.read()
ids = "".join('<p:sldId id="%d" r:id="rId%d"/>' % (256 + i, 100 + i + 1) for i in range(N))
import re
pres = re.sub(r"<p:sldIdLst>.*?</p:sldIdLst>", "<p:sldIdLst>%s</p:sldIdLst>" % ids, pres, flags=re.S)
with open(os.path.join(UNP, "ppt", "presentation.xml"), "w", encoding="utf-8") as fh:
    fh.write(pres)

# [Content_Types].xml — overrides por slide
with open(os.path.join(UNP, "[Content_Types].xml"), encoding="utf-8") as fh:
    ct = fh.read()
ct = re.sub(r'<Override PartName="/ppt/slides/slide\d+\.xml"[^/]*/>', "", ct)
ov = "".join('<Override PartName="/ppt/slides/slide%d.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>' % i for i in range(1, N + 1))
ct = ct.replace("</Types>", ov + "</Types>")
with open(os.path.join(UNP, "[Content_Types].xml"), "w", encoding="utf-8") as fh:
    fh.write(ct)

print("OK: %d slides generados" % N)
