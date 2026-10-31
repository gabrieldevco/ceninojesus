import { useState, type ChangeEvent, type FormEvent } from 'react'
import { ErrorApi } from '@/shared/http/errores'
import { useToast } from '@/shared/ui/toast'
import { IMAGENES_POR_DEFECTO } from '../domain/contenidoPorDefecto'
import {
  CAMPOS_DE_SECCION,
  deSeccion,
  ElementoInvalido,
  ETIQUETA_DE_ICONO,
  ETIQUETA_DE_IMAGEN,
  ETIQUETA_DE_SECCION,
  ICONOS_DE_OFERTA,
  ImagenInvalida,
  imagenUnica,
  SECCIONES_DE_IMAGEN,
  SECCIONES_DE_LISTA,
  type ElementoLanding,
  type InformacionLanding,
  type SeccionDeImagen,
  type SeccionDeLista,
} from '../domain/landing'
import {
  EnlaceInvalido,
  ETIQUETA_DE_TIPO_DE_ENLACE,
  TIPOS_DE_ENLACE,
  type EnlaceEditable,
  type NuevoEnlace,
  type TipoDeEnlace,
} from '../domain/sitio'
import {
  useActualizarElemento,
  useActualizarEnlace,
  useActualizarInformacion,
  useContenidoLanding,
  useCrearElemento,
  useCrearEnlace,
  useElementosDelSitio,
  useEliminarElemento,
  useEliminarEnlace,
  useEnlacesEditables,
  useQuitarImagen,
  useReemplazarImagenUnica,
  useSubirImagen,
} from './InstitucionalProvider'

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (error instanceof ElementoInvalido || error instanceof EnlaceInvalido || error instanceof ImagenInvalida) return error.message
  if (error instanceof ErrorApi) {
    const primero = Object.values(error.campos)[0]?.[0]
    return primero ?? error.detalle
  }
  return porDefecto
}

// ------------------------------------------------------------------ Textos

type CampoDeTexto = { campo: keyof InformacionLanding; etiqueta: string; largo?: boolean; ayuda?: string }

const GRUPOS_DE_TEXTO: ReadonlyArray<{ titulo: string; campos: CampoDeTexto[] }> = [
  {
    titulo: 'Portada',
    campos: [
      { campo: 'portadaEtiqueta', etiqueta: 'Etiqueta sobre el título' },
      { campo: 'portadaTitulo', etiqueta: 'Título' },
      { campo: 'portadaDestacado', etiqueta: 'Parte destacada del título', ayuda: 'Se muestra con color, a continuación del título.' },
      { campo: 'portadaTexto', etiqueta: 'Texto de presentación', largo: true },
    ],
  },
  {
    titulo: '¿Quiénes somos?',
    campos: [
      { campo: 'quienesPrincipal', etiqueta: 'Texto principal', largo: true },
      { campo: 'quienesSecundario', etiqueta: 'Texto complementario', largo: true },
    ],
  },
  {
    titulo: 'Enfoque constructivista',
    campos: [
      { campo: 'enfoqueTitulo', etiqueta: 'Título' },
      { campo: 'enfoqueTexto', etiqueta: 'Texto', largo: true },
      { campo: 'enfoquePasos', etiqueta: 'Pasos', ayuda: 'Sepáralos con comas: Explorar, Preguntar, Construir.' },
      { campo: 'enfoqueNota', etiqueta: 'Nota final' },
    ],
  },
  {
    titulo: 'Horizonte institucional',
    campos: [
      { campo: 'historia', etiqueta: 'Historia', largo: true },
      { campo: 'mision', etiqueta: 'Misión', largo: true },
      { campo: 'vision', etiqueta: 'Visión', largo: true },
    ],
  },
  {
    titulo: 'Contacto y pie de página',
    campos: [
      { campo: 'contactoTitulo', etiqueta: 'Título de la sección de contacto' },
      { campo: 'contactoTexto', etiqueta: 'Texto de la sección de contacto', largo: true },
      { campo: 'pieDescripcion', etiqueta: 'Descripción del pie de página', largo: true },
      { campo: 'direccion', etiqueta: 'Dirección' },
      { campo: 'ciudad', etiqueta: 'Ciudad' },
      { campo: 'telefonos', etiqueta: 'Teléfonos', ayuda: 'El primero se usa para el botón "Llamar ahora".' },
      { campo: 'correo', etiqueta: 'Correo' },
      { campo: 'horarioAtencion', etiqueta: 'Horario de atención' },
      { campo: 'urlFacebook', etiqueta: 'Dirección de Facebook', ayuda: 'Debe empezar por https://' },
      { campo: 'urlMapa', etiqueta: 'Dirección del mapa', ayuda: 'Debe empezar por https://' },
    ],
  },
  {
    titulo: 'Política de tratamiento de datos (Ley 1581)',
    campos: [{ campo: 'politicaTratamientoDatos', etiqueta: 'Texto de la política', largo: true, ayuda: 'Separa los párrafos con una línea en blanco.' }],
  },
]

function FormularioDeTextos({ informacion }: { informacion: InformacionLanding }) {
  const { push } = useToast()
  const guardar = useActualizarInformacion()
  const [borrador, setBorrador] = useState<InformacionLanding>(informacion)

  const cambiar = <K extends keyof InformacionLanding>(campo: K, valor: InformacionLanding[K]) =>
    setBorrador((b) => ({ ...b, [campo]: valor }))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    guardar.mutate(borrador, {
      onSuccess: () => push('Textos guardados. Ya se ven en la página.'),
      onError: (error) => push(mensajeDeError(error, 'No se pudieron guardar los textos.'), 'warn'),
    })
  }

  return (
    <form className="form" onSubmit={enviar} noValidate aria-label="Textos de la página">
      {GRUPOS_DE_TEXTO.map((grupo) => (
        <fieldset key={grupo.titulo} className="card">
          <legend>
            <b>{grupo.titulo}</b>
          </legend>
          {grupo.campos.map(({ campo, etiqueta, largo, ayuda }) => (
            <label key={campo}>
              {etiqueta}
              {largo ? (
                <textarea rows={4} value={String(borrador[campo])} onChange={(e) => cambiar(campo, e.target.value as never)} />
              ) : (
                <input value={String(borrador[campo])} onChange={(e) => cambiar(campo, e.target.value as never)} />
              )}
              {ayuda && <small className="muted-p">{ayuda}</small>}
            </label>
          ))}
          {grupo.titulo === 'Horizonte institucional' && (
            <label className="check">
              <input
                type="checkbox"
                checked={borrador.horizontePendienteValidacion}
                onChange={(e) => cambiar('horizontePendienteValidacion', e.target.checked)}
              />
              <span>Mostrar el aviso "Textos propuestos · Pendientes de validación". Desmárcalo cuando sean los oficiales.</span>
            </label>
          )}
        </fieldset>
      ))}
      <button className="btn" disabled={guardar.isPending}>
        {guardar.isPending ? 'Guardando…' : 'Guardar textos'}
      </button>
    </form>
  )
}

function PanelDeTextos() {
  const { contenido, esDeRespaldo } = useContenidoLanding()
  if (esDeRespaldo) {
    return <p className="muted-p">Cargando los textos actuales… Si esto no termina, revisa la conexión: no se puede editar sin ver lo publicado.</p>
  }
  return <FormularioDeTextos informacion={contenido.informacion} />
}

// ------------------------------------------------------------------ Listas

interface Borrador {
  titulo: string
  texto: string
  detalle: string
  icono: string
}

const BORRADOR_VACIO: Borrador = { titulo: '', texto: '', detalle: '', icono: '' }

function FormularioDeElemento({
  seccion,
  elemento,
  siguienteOrden,
  alTerminar,
}: {
  seccion: SeccionDeLista
  elemento: ElementoLanding | null
  siguienteOrden: number
  alTerminar: () => void
}) {
  const { push } = useToast()
  const crear = useCrearElemento()
  const actualizar = useActualizarElemento()
  const subir = useSubirImagen()
  const campos = CAMPOS_DE_SECCION[seccion]
  const [borrador, setBorrador] = useState<Borrador>(
    elemento
      ? { titulo: elemento.titulo, texto: elemento.texto, detalle: elemento.detalle, icono: elemento.icono }
      : { ...BORRADOR_VACIO, icono: campos.icono === 'oferta' ? ICONOS_DE_OFERTA[0] : '' },
  )
  const [archivo, setArchivo] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pendiente = crear.isPending || actualizar.isPending || subir.isPending

  const fallar = (e: unknown) => setError(mensajeDeError(e, 'No se pudo guardar.'))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (elemento) {
      actualizar.mutate(
        { elemento, cambios: borrador },
        {
          onSuccess: () => {
            push('Cambios guardados')
            alTerminar()
          },
          onError: fallar,
        },
      )
      return
    }
    crear.mutate(
      { seccion, ...borrador, orden: siguienteOrden, activo: true },
      {
        onSuccess: (creado) => {
          if (!archivo) {
            push('Elemento agregado')
            alTerminar()
            return
          }
          subir.mutate(
            { id: creado.id, archivo },
            {
              onSuccess: () => {
                push('Elemento agregado con su imagen')
                alTerminar()
              },
              onError: (e2) => {
                push(`Se agregó, pero la imagen falló: ${mensajeDeError(e2, 'intenta subirla de nuevo.')}`, 'warn')
                alTerminar()
              },
            },
          )
        },
        onError: fallar,
      },
    )
  }

  return (
    <form className="card form" onSubmit={enviar} noValidate aria-label={elemento ? `Editar ${elemento.titulo}` : `Agregar a ${ETIQUETA_DE_SECCION[seccion]}`}>
      <label>
        {campos.titulo} *
        <input value={borrador.titulo} onChange={(e) => setBorrador({ ...borrador, titulo: e.target.value })} maxLength={200} />
      </label>
      <label>
        {campos.texto}
        <textarea rows={3} value={borrador.texto} onChange={(e) => setBorrador({ ...borrador, texto: e.target.value })} />
      </label>
      {campos.detalle && (
        <label>
          {campos.detalle}
          <input type="email" value={borrador.detalle} onChange={(e) => setBorrador({ ...borrador, detalle: e.target.value })} />
        </label>
      )}
      {campos.icono === 'emoji' && (
        <label>
          Emoji
          <input value={borrador.icono} onChange={(e) => setBorrador({ ...borrador, icono: e.target.value })} maxLength={8} />
        </label>
      )}
      {campos.icono === 'oferta' && (
        <label>
          Ícono
          <select value={borrador.icono} onChange={(e) => setBorrador({ ...borrador, icono: e.target.value })}>
            {ICONOS_DE_OFERTA.map((icono) => (
              <option key={icono} value={icono}>
                {ETIQUETA_DE_ICONO[icono]}
              </option>
            ))}
          </select>
        </label>
      )}
      {seccion === 'galeria' && !elemento && (
        <label>
          Imagen (JPG o PNG)
          <input type="file" accept="image/jpeg,image/png" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
        </label>
      )}
      {error && (
        <small className="field-err" role="alert">
          {error}
        </small>
      )}
      <div className="btns">
        <button className="btn" disabled={pendiente}>
          {pendiente ? 'Guardando…' : elemento ? 'Guardar cambios' : 'Agregar'}
        </button>
        <button type="button" className="btn outline" onClick={alTerminar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

function FilaDeElemento({
  elemento,
  anterior,
  siguiente,
  alEditar,
}: {
  elemento: ElementoLanding
  anterior: ElementoLanding | null
  siguiente: ElementoLanding | null
  alEditar: () => void
}) {
  const { push } = useToast()
  const actualizar = useActualizarElemento()
  const eliminar = useEliminarElemento()
  const subir = useSubirImagen()
  const quitar = useQuitarImagen()
  const [confirmando, setConfirmando] = useState(false)
  const avisar = (e: unknown) => push(mensajeDeError(e, 'No se pudo guardar el cambio.'), 'warn')

  /** Intercambia el orden con el vecino: los dos reciben su posición en la lista. */
  const mover = (vecino: ElementoLanding, haciaArriba: boolean) => {
    const [primero, segundo] = haciaArriba ? [elemento, vecino] : [vecino, elemento]
    const base = Math.min(primero.orden, segundo.orden)
    actualizar.mutate({ elemento: primero, cambios: { orden: base } }, { onError: avisar })
    actualizar.mutate({ elemento: segundo, cambios: { orden: base + 1 } }, { onError: avisar })
  }

  const alElegirImagen = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    subir.mutate({ id: elemento.id, archivo }, { onSuccess: () => push('Imagen actualizada'), onError: avisar })
  }

  return (
    <li className="fila-elemento" aria-label={elemento.titulo}>
      {elemento.seccion === 'galeria' && elemento.imagen && (
        <img src={elemento.imagen} alt={elemento.texto || elemento.titulo} width={72} height={48} style={{ objectFit: 'cover', borderRadius: 6 }} />
      )}
      <span style={{ flex: 1 }}>
        <b>{elemento.titulo}</b>
        {elemento.texto && elemento.seccion !== 'galeria' && <small> — {elemento.texto.slice(0, 80)}{elemento.texto.length > 80 ? '…' : ''}</small>}
        {!elemento.activo && <span className="badge rechazada">Oculto</span>}
        {elemento.seccion === 'galeria' && !elemento.imagen && <span className="badge pendiente">Sin imagen: no se muestra</span>}
      </span>
      <span className="btns">
        <button className="btn outline" disabled={!anterior || actualizar.isPending} onClick={() => anterior && mover(anterior, true)} aria-label={`Subir ${elemento.titulo}`}>
          ↑
        </button>
        <button className="btn outline" disabled={!siguiente || actualizar.isPending} onClick={() => siguiente && mover(siguiente, false)} aria-label={`Bajar ${elemento.titulo}`}>
          ↓
        </button>
        <button className="btn outline" onClick={alEditar}>
          Editar
        </button>
        <button
          className="btn outline"
          disabled={actualizar.isPending}
          onClick={() => actualizar.mutate({ elemento, cambios: { activo: !elemento.activo } }, { onError: avisar })}
        >
          {elemento.activo ? 'Ocultar' : 'Mostrar'}
        </button>
        {elemento.seccion === 'galeria' && (
          <>
            <label className="btn outline" style={{ cursor: 'pointer' }}>
              {elemento.imagen ? 'Cambiar imagen' : 'Subir imagen'}
              <input type="file" accept="image/jpeg,image/png" hidden onChange={alElegirImagen} aria-label={`Imagen de ${elemento.titulo}`} />
            </label>
            {elemento.tieneImagenSubida && (
              <button className="btn outline" onClick={() => quitar.mutate(elemento.id, { onError: avisar })}>
                Quitar imagen subida
              </button>
            )}
          </>
        )}
        {confirmando ? (
          <>
            <button
              className="btn"
              disabled={eliminar.isPending}
              onClick={() => eliminar.mutate(elemento.id, { onSuccess: () => push('Elemento eliminado'), onError: avisar })}
            >
              Confirmar eliminación
            </button>
            <button className="btn outline" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button className="btn outline" onClick={() => setConfirmando(true)}>
            Eliminar
          </button>
        )}
      </span>
    </li>
  )
}

function SeccionDeElementos({ seccion, elementos }: { seccion: SeccionDeLista; elementos: ElementoLanding[] }) {
  // `null` = cerrado; `0` = agregando; el resto, el id del elemento en edición
  const [abierto, setAbierto] = useState<number | null>(null)
  const ordenados = deSeccion({ elementos }, seccion)
  const siguienteOrden = ordenados.reduce((mayor, e) => Math.max(mayor, e.orden + 1), 0)
  const enEdicion = ordenados.find((e) => e.id === abierto) ?? null

  return (
    <section className="card" aria-label={ETIQUETA_DE_SECCION[seccion]}>
      <h3>{ETIQUETA_DE_SECCION[seccion]}</h3>
      {ordenados.length === 0 && <p className="muted-p">Todavía no hay elementos: la sección no aparece en la página.</p>}
      <ul className="lista-elementos">
        {ordenados.map((e, i) => (
          <FilaDeElemento
            key={e.id}
            elemento={e}
            anterior={ordenados[i - 1] ?? null}
            siguiente={ordenados[i + 1] ?? null}
            alEditar={() => setAbierto(e.id)}
          />
        ))}
      </ul>
      {abierto === null ? (
        <button className="btn" onClick={() => setAbierto(0)}>
          Agregar
        </button>
      ) : (
        <FormularioDeElemento key={abierto} seccion={seccion} elemento={enEdicion} siguienteOrden={siguienteOrden} alTerminar={() => setAbierto(null)} />
      )}
    </section>
  )
}

function PanelDeListas() {
  const { elementos, cargando, error } = useElementosDelSitio()
  return (
    <>
      {cargando && <p className="muted-p">Cargando…</p>}
      {error && <p className="muted-p">No pudimos cargar el contenido. Intenta de nuevo más tarde.</p>}
      {!cargando && !error && SECCIONES_DE_LISTA.map((seccion) => <SeccionDeElementos key={seccion} seccion={seccion} elementos={elementos} />)}
    </>
  )
}

// ---------------------------------------------------------------- Imágenes

function TarjetaDeImagen({ seccion, elementos }: { seccion: SeccionDeImagen; elementos: ElementoLanding[] }) {
  const { push } = useToast()
  const reemplazar = useReemplazarImagenUnica()
  const quitar = useQuitarImagen()
  const { contenido } = useContenidoLanding()
  const elemento = elementos.find((e) => e.seccion === seccion) ?? null
  const actual = imagenUnica(contenido, seccion, IMAGENES_POR_DEFECTO[seccion])

  const alElegir = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    reemplazar.mutate(
      { seccion, archivo },
      { onSuccess: () => push('Imagen actualizada'), onError: (error) => push(mensajeDeError(error, 'No se pudo subir la imagen.'), 'warn') },
    )
  }

  return (
    <article className="card inner" aria-label={ETIQUETA_DE_IMAGEN[seccion]}>
      <h4>{ETIQUETA_DE_IMAGEN[seccion]}</h4>
      <img src={actual.src} alt={actual.alt} style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }} />
      <div className="btns">
        <label className="btn" style={{ cursor: 'pointer' }}>
          {reemplazar.isPending ? 'Subiendo…' : 'Cambiar imagen'}
          <input type="file" accept="image/jpeg,image/png" hidden onChange={alElegir} aria-label={`Archivo para ${ETIQUETA_DE_IMAGEN[seccion]}`} />
        </label>
        {elemento?.tieneImagenSubida && (
          <button
            className="btn outline"
            disabled={quitar.isPending}
            onClick={() => quitar.mutate(elemento.id, { onSuccess: () => push('Se volvió a la imagen original'), onError: (error) => push(mensajeDeError(error, 'No se pudo quitar.'), 'warn') })}
          >
            Volver a la original
          </button>
        )}
      </div>
    </article>
  )
}

function PanelDeImagenes() {
  const { elementos, cargando } = useElementosDelSitio()
  return (
    <>
      <p className="muted-p">JPG o PNG de hasta 5 MB. Para la galería usa la pestaña "Listas y fotos".</p>
      {cargando ? <p className="muted-p">Cargando…</p> : (
        <div className="grid3">
          {SECCIONES_DE_IMAGEN.map((seccion) => <TarjetaDeImagen key={seccion} seccion={seccion} elementos={elementos} />)}
        </div>
      )}
    </>
  )
}

// ----------------------------------------------------------------- Enlaces

const ENLACE_VACIO: NuevoEnlace = { nombre: '', url: '', tipo: 'otro', descripcion: '', requiereAutenticacion: false, orden: 0, activo: true }

function FormularioDeEnlace({ enlace, siguienteOrden, alTerminar }: { enlace: EnlaceEditable | null; siguienteOrden: number; alTerminar: () => void }) {
  const { push } = useToast()
  const crear = useCrearEnlace()
  const actualizar = useActualizarEnlace()
  const [borrador, setBorrador] = useState<NuevoEnlace>(enlace ?? { ...ENLACE_VACIO, orden: siguienteOrden })
  const [error, setError] = useState<string | null>(null)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const opciones = {
      onSuccess: () => {
        push('Enlace guardado')
        alTerminar()
      },
      onError: (err: unknown) => setError(mensajeDeError(err, 'No se pudo guardar el enlace.')),
    }
    if (enlace) actualizar.mutate({ id: enlace.id, cambios: borrador }, opciones)
    else crear.mutate(borrador, opciones)
  }

  return (
    <form className="card form" onSubmit={enviar} noValidate aria-label={enlace ? `Editar ${enlace.nombre}` : 'Agregar enlace'}>
      <div className="row2">
        <label>
          Nombre *
          <input value={borrador.nombre} onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })} maxLength={100} />
        </label>
        <label>
          Tipo
          <select value={borrador.tipo} onChange={(e) => setBorrador({ ...borrador, tipo: e.target.value as TipoDeEnlace })}>
            {TIPOS_DE_ENLACE.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ETIQUETA_DE_TIPO_DE_ENLACE[tipo]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Dirección *
        <input value={borrador.url} onChange={(e) => setBorrador({ ...borrador, url: e.target.value })} placeholder="https://" />
      </label>
      <label>
        Descripción
        <input value={borrador.descripcion} onChange={(e) => setBorrador({ ...borrador, descripcion: e.target.value })} maxLength={255} />
      </label>
      <label className="check">
        <input type="checkbox" checked={borrador.requiereAutenticacion} onChange={(e) => setBorrador({ ...borrador, requiereAutenticacion: e.target.checked })} />
        <span>Solo para quienes inician sesión</span>
      </label>
      {error && (
        <small className="field-err" role="alert">
          {error}
        </small>
      )}
      <div className="btns">
        <button className="btn" disabled={crear.isPending || actualizar.isPending}>
          Guardar enlace
        </button>
        <button type="button" className="btn outline" onClick={alTerminar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

function PanelDeEnlaces() {
  const { push } = useToast()
  const { enlaces, cargando, error } = useEnlacesEditables()
  const actualizar = useActualizarEnlace()
  const eliminar = useEliminarEnlace()
  const [abierto, setAbierto] = useState<number | null>(null)
  const enEdicion = enlaces.find((e) => e.id === abierto) ?? null
  const siguienteOrden = enlaces.reduce((mayor, e) => Math.max(mayor, e.orden + 1), 0)
  const avisar = (e: unknown) => push(mensajeDeError(e, 'No se pudo guardar el cambio.'), 'warn')

  return (
    <section className="card" aria-label="Enlaces del portal">
      <h3>Enlaces del portal</h3>
      <p className="muted-p">Aula virtual, biblioteca y otros sistemas. La biblioteca aparece en el menú del portal cuando hay un enlace activo de ese tipo.</p>
      {cargando && <p className="muted-p">Cargando…</p>}
      {error && <p className="muted-p">No pudimos cargar los enlaces.</p>}
      <ul className="lista-elementos">
        {enlaces.map((e) => (
          <li key={e.id} className="fila-elemento" aria-label={e.nombre}>
            <span style={{ flex: 1 }}>
              <b>{e.nombre}</b> <small>{ETIQUETA_DE_TIPO_DE_ENLACE[e.tipo]} · {e.url}</small>
              {!e.activo && <span className="badge rechazada">Oculto</span>}
              {e.requiereAutenticacion && <span className="badge pendiente">Con sesión</span>}
            </span>
            <span className="btns">
              <button className="btn outline" onClick={() => setAbierto(e.id)}>
                Editar
              </button>
              <button className="btn outline" disabled={actualizar.isPending} onClick={() => actualizar.mutate({ id: e.id, cambios: { activo: !e.activo } }, { onError: avisar })}>
                {e.activo ? 'Ocultar' : 'Mostrar'}
              </button>
              <button className="btn outline" disabled={eliminar.isPending} onClick={() => eliminar.mutate(e.id, { onSuccess: () => push('Enlace eliminado'), onError: avisar })}>
                Eliminar
              </button>
            </span>
          </li>
        ))}
      </ul>
      {abierto === null ? (
        <button className="btn" onClick={() => setAbierto(0)}>
          Agregar enlace
        </button>
      ) : (
        <FormularioDeEnlace key={abierto} enlace={enEdicion} siguienteOrden={siguienteOrden} alTerminar={() => setAbierto(null)} />
      )}
    </section>
  )
}

// ------------------------------------------------------------------ Página

type Pestana = 'textos' | 'listas' | 'imagenes' | 'enlaces'

const PESTANAS: ReadonlyArray<readonly [Pestana, string]> = [
  ['textos', 'Textos'],
  ['listas', 'Listas y fotos'],
  ['imagenes', 'Imágenes principales'],
  ['enlaces', 'Enlaces'],
]

/** RF-01: la institución administra todo lo que se ve en la página de inicio. */
export default function GestionSitioPage() {
  const [pestana, setPestana] = useState<Pestana>('textos')
  return (
    <>
      <p className="kicker">SITIO WEB</p>
      <h1 className="ptitle">Contenido de la página de inicio</h1>
      <p className="sub">
        Edita los textos, las listas, las fotos y los enlaces que ve el público. Los cambios se publican al guardar; no hace falta pedir nada al equipo técnico.
      </p>
      <div className="ftabs" role="tablist">
        {PESTANAS.map(([id, etiqueta]) => (
          <button key={id} role="tab" aria-selected={pestana === id} className={pestana === id ? 'on' : ''} onClick={() => setPestana(id)}>
            {etiqueta}
          </button>
        ))}
      </div>
      {pestana === 'textos' && <PanelDeTextos />}
      {pestana === 'listas' && <PanelDeListas />}
      {pestana === 'imagenes' && <PanelDeImagenes />}
      {pestana === 'enlaces' && <PanelDeEnlaces />}
    </>
  )
}
