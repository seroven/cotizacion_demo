import logo from '../assets/logo.png?inline'
import normas from '../assets/normas.png?inline'
import { uid } from './blocks.js'

const block = (type, data) => ({ id: uid(), type, data })
const section = (title, level = 1) => block('section', { title, level })
const escH = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const paragraphsHtml = (t, { bold, align }) =>
  t
    .split('\n')
    .map((l) => {
      const st = align !== 'left' ? ` style="text-align: ${align}"` : ''
      if (!l.trim()) return `<p${st}></p>`
      return `<p${st}>${bold ? `<strong>${escH(l)}</strong>` : escH(l)}</p>`
    })
    .join('')
const text = (t, { bold = false, align = 'justify' } = {}) => block('text', { html: paragraphsHtml(t, { bold, align }) })
const li = (t, level = 0) => ({ id: uid(), text: t, level })
const list = (style, ...items) =>
  block('list', {
    style,
    items: items.map((i) => (typeof i === 'string' ? li(i) : i)),
  })
const group = (code, desc) => ({ id: uid(), kind: 'group', code, desc })
const item = (code, desc, unit, qty, price) => ({
  id: uid(),
  kind: 'item',
  code,
  desc,
  unit,
  qty: String(qty),
  price: String(price),
})

export function buildSeedTemplate() {
  const blocks = [
    block('header', {
      logo,
      company: 'EURO PERFORMANCE APP SAC',
      ruc: '20604545081',
      tagline: 'Fabricaciones y Montajes de Estructuras Metálicas',
      email: 'ventas@europerformanceapp.com',
      showMeta: true,
      formato: 'EP-FR-GEC-02',
      fecha: '2025-05-12',
      rev: '0',
    }),
    block('title', {
      title: 'PROPUESTA TÉCNICO – ECONÓMICA',
      subtitle: 'PTO_EUROPER_2026-5 Rev. 0',
    }),
    block('fields', {
      fields: [
        { id: uid(), label: 'Fecha', value: '', kind: 'date', auto: true },
        { id: uid(), label: 'Señores', value: 'CONSORCIO VIAL CHOSICA', kind: 'text' },
        { id: uid(), label: 'RUC', value: '', kind: 'text' },
        { id: uid(), label: 'Atención', value: 'Srta. Barbara Castillo', kind: 'text' },
        {
          id: uid(),
          label: 'Asunto',
          value:
            'Mejoramiento de la Transitabilidad Vehicular y Peatonal en el Puente La Capitana – Lurigancho',
          kind: 'long',
        },
        { id: uid(), label: 'Referencia', value: '', kind: 'long' },
      ],
    }),
    text(
      [
        'De nuestra consideración.',
        'Agradecemos su gentil invitación, nos es grato hacerles llegar nuestra propuesta Técnico – Económica a "Precios unitarios" por los trabajos de la referencia enviados en su carpeta.',
        'La propuesta se ha elaborado sobre la base de la información recibida (planos de diseño básico, informe de diseño estructural y especificaciones técnicas) complementada con nuestras aclaraciones y excepciones detalladas en este documento.',
        'A la espera de vernos favorecidos, con sus gratas órdenes, quedamos de ustedes.',
      ].join('\n'),
    ),
    block('signature', {
      closing: 'Atentamente',
      name: 'Marianella Yparraguirre',
      role: 'Ing. de Planeamiento y Presupuesto',
      image: '',
    }),
    block('spacer', { kind: 'pagebreak', height: 24 }),

    section('Objeto'),
    text(
      'La presente oferta corresponde al Suministro, Fabricación, Preensamble, Traslado a obra y Montaje de las estructuras metálicas del puente La Capitana, de acuerdo a la información enviada por su representada (pesos, dimensiones, planos y arreglos generales).',
    ),

    section('Bases de la oferta'),
    text(
      'Nuestra oferta está basada en información recibida del Cliente mediante correo electrónico y nuestras consideraciones indicadas en la presente oferta.',
    ),
    list(
      'sectionnum',
      'SUMINISTRO DE ESTRUCTURAS METÁLICAS',
      'FABRICACIÓN DE ESTRUCTURA METÁLICA',
      'ARENADO Y PINTURA',
      'PRE-MONTAJE',
      'MONTAJE DE ESTRUCTURAS METÁLICAS',
    ),
    block('image', { src: normas, width: 62, align: 'left', caption: '' }),

    section('Oferta económica'),
    text(
      'Nuestra oferta es a precios unitarios y con un metrado referencial según los planos de arreglo general.',
      { bold: true },
    ),
    block('table', {
      currency: 'USD',
      subtotalLabel: 'SUBTOTAL EN DÓLARES (PRECIO NO INCLUYE I.G.V. 18%)',
      totalLabel: 'TOTAL',
      showGroupTotals: false,
      rows: [
        group('3.01', 'ESTRUCTURA METÁLICA'),
        item('3.01.01', 'VIGA TIRANTE - ACERO ASTM A709 GRADO 50 Fy=3600 Kg/cm2', 'Ton', 84.14, 2300),
        item('3.01.02', 'VIGAS TRANSVERSALES - ACERO ASTM A709 GRADO 50 Fy=3500 Kg/cm2', 'Ton', 39.85, 2300),
        item('3.01.03', 'VIGAS CIERRE Y DE APOYO - ACERO ASTM A709 GRADO 50 Fy=3500 Kg/cm2', 'Ton', 17.74, 2300),
        item('3.01.04', 'ARCOS - ACERO ASTM A709 Fy=3500 Kg/cm2', 'Ton', 115.89, 2490),
        item('3.01.05', 'CONECTORES STUDS 7/8 X 0.150 - ACERO AST 108 FU=60 KSI', 'UND', 1652, 2.55),
        item('3.01.06', 'MONTAJE Y LANZAMIENTO DE ESTRUCTURAS METÁLICAS Y PÉNDOLA', 'Ton', 290.84, 1060),
        item('3.01.07', 'TRANSPORTE DE ESTRUCTURAS METÁLICAS', 'Ton', 290.84, 120),
        item('3.01.08', 'PINTURA DE ESTRUCTURA METÁLICA', 'm2', 974.51, 20.5),
      ],
      adjustments: [],
    }),
    block('callout', {
      title: 'NOTA IMPORTANTE',
      tone: 'warning',
      text: 'En la partida 3.01.06 estamos considerando el servicio de ensayos no destructivos, seguros, equipamiento administrativo, alquiler de maquinaria y equipos, elementos de manipuleo y caseta de seguridad.\n\nNo se están considerando las barandas metálicas ni las juntas de dilatación (neopreno y grouting); sin embargo, en caso de ser requerido, podemos cotizar.',
    }),

    section('Alcance de los trabajos'),
    text('Nuestra oferta contempla los siguientes trabajos.'),
    list(
      'dash',
      'Desarrollo de planos de taller para la fabricación y planos de marca para el montaje.',
      'Suministro y fabricación de estructuras metálicas de un puente.',
      'Pre-armado en taller de las vigas longitudinales, para la verificación de la contraflecha.',
      'Preparación superficial y pintado de estructuras metálicas en taller.',
      'Transporte de estructuras metálicas a obra.',
      'Armado, soldeo y lanzamiento de estructuras metálicas de puente.',
      'Elaboración y entrega de dossier de calidad.',
    ),

    section('Materiales principales'),
    text('Para el suministro se han considerado los siguientes materiales principales:'),
    list(
      'dash',
      'Planchas: ASTM A36 y ASTM A709 GR 50.',
      'Canales y ángulos: acero ASTM A36.',
      'Pernos estructurales: ASTM A325 en negro.',
      'Los espesores de planchas no comerciales serán reemplazados por el espesor comercial superior.',
    ),

    section('Transporte'),
    text('Carga y transporte de estructuras metálicas desde planta de Europerformance hasta la obra.'),
    text('Las fabricaciones metálicas se realizarán de modo que sean transportables:'),
    list('dash', 'Plataforma (estructura de puente) dimensiones máximas: largo 12 m, ancho 2.60 m, alto 2.40 m.'),
    text('De existir piezas sobredimensionadas, se cotizará según sea el caso.'),

    section('Pruebas e inspecciones'),
    list(
      'letter',
      li(
        'El 100 % de RT o UT en juntas CJP (juntas de penetración completa) que trabajan a tracción, excepto en juntas a tope verticales en el alma, en vigas secundarias o principales como se indica a continuación:',
      ),
      li('1/6 de altura del alma por UT, empezando por el punto de máxima tensión.', 1),
      li('25 % de UT al resto de la longitud del alma.', 1),
      li('25 % de ensayo UT en juntas CJP, en juntas de ranura, en juntas en T o en juntas de esquina.'),
      li(
        'La aplicación de tintes penetrantes para la verificación de la calidad de los cordones de soldadura durante la etapa de ejecución será obligatoria para todos los cordones de soldadura.',
      ),
    ),
    text('Entrega de Dossier de Calidad según la siguiente estructura:', { bold: true }),
    list(
      'number',
      'Plan de Calidad.',
      'Procedimientos de ensayos NDT.',
      'Procedimientos de soldadura WPS.',
      'Calificación del desempeño del soldador WPQ.',
      'Registro de calibración de instrumentos de medición.',
      'Registro de recepción de materiales (certificado de calidad).',
      'Registro de trazabilidad.',
      'Registro de control dimensional.',
      'Registro de inspección visual.',
      'Registros de inspección mediante líquidos penetrantes.',
      'Registro de aplicación de pintura.',
    ),

    section('Protección superficial'),
    text('Los materiales de acero al carbono tendrán un tratamiento superficial según indican las EETT:'),
    text('Tratamiento superficial: arenado a metal blanco SSPC-SP5.', { bold: true }),
    text('Aplicación de pintura:', { bold: true }),
    list(
      'dash',
      '1ra capa base imprimante epóxico epoxi poliamida bicomponente, a 3 mils EPS.',
      '2da capa intermedia pintura epóxica de alto contenido de sólidos (80% - 83%) epoxi poliamina amida a 4 mils EPS.',
      '3ra capa acabado pintura poliuretano alifático (50% - 66% sólidos) a 3 mils EPS.',
      'Espesor total del sistema: 10 mils.',
    ),

    section('Consideraciones generales'),
    list(
      'dash',
      'Nuestra oferta es a PRECIOS UNITARIOS e incluye material, mano de obra, gastos generales y utilidad.',
      'Los precios NO incluyen el 18 % de IGV.',
      'Para las fabricaciones en taller:',
      li('Nuestros precios consideran el uso de empalmes si así lo requieran.', 1),
      li(
        'Las estructuras irán completamente pintadas (base, intermedia y acabado); en obra se realizará el pintado de empalmes y retoques de los daños puntuales propios del montaje y la manipulación.',
        1,
      ),
      'Para el montaje:',
      li('01 Ingeniero Supervisor permanente en obra.', 1),
      li('01 Prevencionista de Riesgos.', 1),
      li('Mano de obra calificada, equipos, herramientas, consumibles y EPP.', 1),
      li('Andamios multidireccionales.', 1),
      li(
        'Equipos de izaje: 01 grúa telescópica de 90 ton para el montaje de las vigas y 01 camión grúa de 15 ton para movimientos.',
        1,
      ),
      li('Suministro y armado de apeos o puntales para el montaje.', 1),
      li('SCTR para todo el personal.', 1),
    ),

    section('Entregables por el cliente'),
    list(
      'dash',
      'Abono.',
      'Planos de diseño.',
      'Aprobación de los planos de fabricación.',
      'PPI del proyecto.',
      'Energía eléctrica a pie de obra. Suministrar energía trifásica 220 V con capacidad de alimentar 06 máquinas de soldar, esmeriles y otros equipos de poder.',
      'Servicios higiénicos para el personal en obra.',
      'Gestiones de ingreso del personal y equipos a obra.',
    ),

    section('Plazo de ejecución'),
    list(
      'dash',
      'Se considera un plazo de 100 días para la fabricación e instalación en obra. Aprobada la orden y luego de suscrito el contrato procederemos a entregar el listado de todos los materiales y el cronograma de obra.',
    ),

    section('Excepciones'),
    text('La presente oferta no incluye lo siguiente y estará a cargo del cliente:'),
    list(
      'dash',
      'Ingeniería básica ni estructural.',
      'Suministro de:',
      li('Pernos de anclaje, pernos de expansión, pernos epóxicos e insertos metálicos.', 1),
      li('Grouting, resina epóxica (Sikadur).', 1),
      li('Barandas.', 1),
      li('Juntas sísmicas y de dilatación.', 1),
      li('Dispositivos de apoyo (planchas mecanizadas) y neopreno.', 1),
      'Vigilancia en obra.',
      'Mecanizado.',
      'Almacenamiento.',
      'Pruebas de carga para los puentes y pruebas de impacto del material.',
      'Ensayos destructivos.',
      'Pruebas en laboratorios externos al acero. Solo los certificados de calidad del proveedor.',
      'Autorizaciones, permisos y licencias municipales.',
      'Pagos de fianzas por fiel cumplimiento, pólizas CAR o RISK.',
      'No se están considerando retenciones por temas de calidad y/o fondos de garantía.',
      'Pagos por temas de Paz Laboral.',
    ),

    section('Formas de pago'),
    text(
      'EUROPERFORMANCE APP entregará al cliente una relación de materiales metálicos (acero) debidamente preciada por 2 empresas distribuidoras; el monto que resulte por la adquisición de estos materiales será depositado directamente por el cliente a la empresa proveedora. Asimismo, esta compra garantizará la calidad de los materiales y su certificación.\n\nEl resultado del total de la compra de los materiales metálicos se descontará al total del presupuesto ofertado por nosotros y la diferencia se pagará con un 5% al inicio y el saldo con valorizaciones quincenales de acuerdo a un cronograma de obra emitido y porcentajes establecidos con el cliente, el mismo que tendrá efecto luego de ser aprobado por la supervisión vuestra.',
    ),

    section('Validez de la oferta'),
    text(
      'Nuestra oferta es válida por 30 días calendario a partir de la emisión de esta propuesta, y podrá ser revisada si los precios de los materiales de acero sufren una variación significativa.',
    ),
  ]

  return {
    id: uid(),
    name: 'Propuesta técnico-económica · Estructuras metálicas',
    description: 'Formato EP-FR-GEC-02 de Euro Performance App, replicado del Excel original.',
    blocks,
  }
}
