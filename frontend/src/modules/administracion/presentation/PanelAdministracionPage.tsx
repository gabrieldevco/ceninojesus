import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '@/modules/auth'
import { ErrorApi } from '@/shared/http/errores'
import { Stat } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import {
  contarPorRol,
  DatosInvalidos,
  estaAnonimizada,
  ETIQUETA_DE_ROL,
  ROLES_ADMINISTRABLES,
  type CuentaDeUsuario,
  type DatosDeGrupo,
  type ErroresDeCampos,
  type GrupoAdministrable,
  type NuevaCuenta,
  type Rol,
} from '../domain/administracion'
import {
  useActualizarGrupo,
  useActualizarUsuario,
  useAnonimizarUsuario,
  useAsignarAdministradores,
  useCrearGrupo,
  useCrearUsuario,
  useGruposAdministrables,
  useUsuarios,
} from './AdministracionProvider'

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (error instanceof ErrorApi) return error.detalle
  if (error instanceof Error && !(error instanceof DatosInvalidos)) return error.message || porDefecto
  return porDefecto
}

const Error_ = ({ texto }: { texto?: string }): ReactNode =>
  texto ? (
    <small className="field-err" role="alert">
      {texto}
    </small>
  ) : null

/** Errores por campo de la API hacia los del formulario. */
function camposDeApi<T>(error: unknown, nombres: Record<string, keyof T>): ErroresDeCampos<T> {
  const resultado: ErroresDeCampos<T> = {}
  if (error instanceof ErrorApi) {
    for (const [campo, mensajes] of Object.entries(error.campos)) {
      const propio = nombres[campo]
      if (propio && mensajes[0]) resultado[propio] = mensajes[0]
    }
  }
  return resultado
}

// ---------------------------------------------------------------- Usuarios

const NUEVA_CUENTA: NuevaCuenta = { nombreUsuario: '', password: '', rol: 'administrador_grupo', correo: '', nombres: '', apellidos: '' }

function FormularioDeCuenta() {
  const { push } = useToast()
  const crear = useCrearUsuario()
  const [datos, setDatos] = useState<NuevaCuenta>(NUEVA_CUENTA)
  const [errores, setErrores] = useState<ErroresDeCampos<NuevaCuenta>>({})

  const cambiar = <K extends keyof NuevaCuenta>(campo: K, valor: NuevaCuenta[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setErrores({})
    crear.mutate(datos, {
      onSuccess: (creada) => {
        setDatos(NUEVA_CUENTA)
        push(`Cuenta creada: ${creada.nombreUsuario}`)
      },
      onError: (error) => {
        if (error instanceof DatosInvalidos) return setErrores(error.campos as ErroresDeCampos<NuevaCuenta>)
        const deCampos = camposDeApi<NuevaCuenta>(error, { nombre_usuario: 'nombreUsuario', password: 'password', correo: 'correo' })
        return Object.keys(deCampos).length > 0 ? setErrores(deCampos) : push(mensajeDeError(error, 'No se pudo crear la cuenta.'), 'warn')
      },
    })
  }

  return (
    <form className="card form" onSubmit={enviar} noValidate aria-label="Crear cuenta">
      <h3>Crear cuenta</h3>
      <div className="row2">
        <label>
          Usuario *
          <input value={datos.nombreUsuario} onChange={(e) => cambiar('nombreUsuario', e.target.value)} autoComplete="off" />
          <Error_ texto={errores.nombreUsuario} />
        </label>
        <label>
          Contraseña inicial *
          <input type="password" value={datos.password} onChange={(e) => cambiar('password', e.target.value)} autoComplete="new-password" />
          <Error_ texto={errores.password} />
        </label>
      </div>
      <div className="row2">
        <label>
          Nombres
          <input value={datos.nombres} onChange={(e) => cambiar('nombres', e.target.value)} />
        </label>
        <label>
          Apellidos
          <input value={datos.apellidos} onChange={(e) => cambiar('apellidos', e.target.value)} />
        </label>
      </div>
      <div className="row2">
        <label>
          Correo
          <input type="email" value={datos.correo} onChange={(e) => cambiar('correo', e.target.value)} />
          <Error_ texto={errores.correo} />
        </label>
        <label>
          Rol
          <select value={datos.rol} onChange={(e) => cambiar('rol', e.target.value as Rol)}>
            {ROLES_ADMINISTRABLES.map((rol) => (
              <option key={rol} value={rol}>
                {ETIQUETA_DE_ROL[rol]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className="btn" disabled={crear.isPending}>
        {crear.isPending ? 'Creando…' : 'Crear cuenta'}
      </button>
    </form>
  )
}

function FilaDeCuenta({ cuenta, esMia }: { cuenta: CuentaDeUsuario; esMia: boolean }) {
  const { push } = useToast()
  const actualizar = useActualizarUsuario()
  const anonimizar = useAnonimizarUsuario()
  const [confirmando, setConfirmando] = useState(false)
  const anonima = estaAnonimizada(cuenta)
  const bloqueada = esMia || anonima

  const cambiar = (cambios: { rol?: Rol; activo?: boolean }, mensaje: string) =>
    actualizar.mutate(
      { id: cuenta.id, cambios },
      { onSuccess: () => push(mensaje), onError: (error) => push(mensajeDeError(error, 'No se pudo guardar el cambio.'), 'warn') },
    )

  const nombre = [cuenta.nombres, cuenta.apellidos].filter(Boolean).join(' ')

  return (
    <tr>
      <td>
        <b>{cuenta.nombreUsuario}</b>
        {esMia && <small> (tú)</small>}
        <br />
        <small>{nombre || (anonima ? 'Datos suprimidos' : 'Sin nombre')}</small>
      </td>
      <td>{cuenta.correo || '—'}</td>
      <td>
        <select
          aria-label={`Rol de ${cuenta.nombreUsuario}`}
          value={cuenta.rol}
          disabled={bloqueada || actualizar.isPending}
          onChange={(e) => cambiar({ rol: e.target.value as Rol }, `${cuenta.nombreUsuario}: ahora es ${ETIQUETA_DE_ROL[e.target.value as Rol].toLowerCase()}`)}
        >
          {ROLES_ADMINISTRABLES.map((rol) => (
            <option key={rol} value={rol}>
              {ETIQUETA_DE_ROL[rol]}
            </option>
          ))}
        </select>
      </td>
      <td>
        <span className={`badge ${cuenta.activo ? 'aprobada' : 'rechazada'}`}>{cuenta.activo ? 'Activa' : 'Inactiva'}</span>
      </td>
      <td>
        {confirmando ? (
          <div className="btns">
            <small>Se borrarán sus datos personales y no se puede deshacer.</small>
            <button
              className="btn"
              disabled={anonimizar.isPending}
              onClick={() =>
                anonimizar.mutate(cuenta.id, {
                  onSuccess: () => {
                    setConfirmando(false)
                    push('Datos suprimidos')
                  },
                  onError: (error) => push(mensajeDeError(error, 'No se pudo anonimizar.'), 'warn'),
                })
              }
            >
              Confirmar
            </button>
            <button className="btn outline" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <div className="btns">
            <button
              className="btn outline"
              disabled={bloqueada || actualizar.isPending}
              onClick={() => cambiar({ activo: !cuenta.activo }, `${cuenta.nombreUsuario}: ${cuenta.activo ? 'desactivada' : 'activada'}`)}
            >
              {cuenta.activo ? 'Desactivar' : 'Activar'}
            </button>
            <button className="btn outline" disabled={bloqueada} onClick={() => setConfirmando(true)}>
              Anonimizar
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

function PanelDeUsuarios() {
  const { usuario } = useAuth()
  const { usuarios, cargando, error } = useUsuarios()
  const [rol, setRol] = useState<'todos' | Rol>('todos')
  const [busqueda, setBusqueda] = useState('')

  const visibles = usuarios.filter(
    (c) =>
      (rol === 'todos' || c.rol === rol) &&
      `${c.nombreUsuario} ${c.nombres} ${c.apellidos} ${c.correo}`.toLowerCase().includes(busqueda.toLowerCase()),
  )

  return (
    <>
      <div className="stats">
        <Stat label="Administradores" value={contarPorRol(usuarios, 'administrador')} hint="Cuentas activas" tone="green" />
        <Stat label="Admin. de grupo" value={contarPorRol(usuarios, 'administrador_grupo')} hint="Cuentas activas" tone="amber" />
        <Stat label="Acudientes" value={contarPorRol(usuarios, 'acudiente')} hint="Cuentas activas" tone="green" />
        <Stat label="Estudiantes" value={contarPorRol(usuarios, 'estudiante')} hint="Cuentas activas" tone="green" />
      </div>

      <FormularioDeCuenta />

      <section className="card">
        <h3>Cuentas</h3>
        <div className="row2">
          <label>
            Buscar
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Usuario, nombre o correo" />
          </label>
        </div>
        <div className="ftabs">
          <button className={rol === 'todos' ? 'on' : ''} onClick={() => setRol('todos')}>
            Todos ({usuarios.length})
          </button>
          {ROLES_ADMINISTRABLES.map((r) => (
            <button key={r} className={rol === r ? 'on' : ''} onClick={() => setRol(r)}>
              {ETIQUETA_DE_ROL[r]} ({usuarios.filter((c) => c.rol === r).length})
            </button>
          ))}
        </div>
        {cargando && <p className="muted-p">Cargando cuentas…</p>}
        {error && <p className="muted-p">No pudimos cargar las cuentas. Intenta de nuevo más tarde.</p>}
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((c) => (
                <FilaDeCuenta key={c.id} cuenta={c} esMia={c.id === usuario?.id} />
              ))}
              {!cargando && visibles.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted-p">
                    No hay cuentas con ese filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

// ------------------------------------------------------------------ Grupos

interface BorradorDeGrupo {
  nombre: string
  descripcion: string
  horario: string
  cupo: string
  activo: boolean
}

const BORRADOR_VACIO: BorradorDeGrupo = { nombre: '', descripcion: '', horario: '', cupo: '', activo: true }

const aBorrador = (g: GrupoAdministrable): BorradorDeGrupo => ({
  nombre: g.nombre,
  descripcion: g.descripcion,
  horario: g.horario,
  cupo: g.cupoMaximo === null ? '' : String(g.cupoMaximo),
  activo: g.activo,
})

function aDatosDeGrupo(b: BorradorDeGrupo): DatosDeGrupo {
  const cupo = b.cupo.trim()
  return { nombre: b.nombre, descripcion: b.descripcion, horario: b.horario, cupoMaximo: cupo === '' ? null : Number(cupo), activo: b.activo }
}

function FormularioDeGrupo({ grupo, alTerminar }: { grupo: GrupoAdministrable | null; alTerminar: () => void }) {
  const { push } = useToast()
  const crear = useCrearGrupo()
  const actualizar = useActualizarGrupo()
  const [borrador, setBorrador] = useState<BorradorDeGrupo>(grupo ? aBorrador(grupo) : BORRADOR_VACIO)
  const [errores, setErrores] = useState<ErroresDeCampos<DatosDeGrupo>>({})
  const pendiente = crear.isPending || actualizar.isPending

  const cambiar = <K extends keyof BorradorDeGrupo>(campo: K, valor: BorradorDeGrupo[K]) => {
    setBorrador((b) => ({ ...b, [campo]: valor }))
    setErrores({})
  }

  const alFallar = (error: unknown) => {
    if (error instanceof DatosInvalidos) return setErrores(error.campos as ErroresDeCampos<DatosDeGrupo>)
    const deCampos = camposDeApi<DatosDeGrupo>(error, { nombre: 'nombre', cupo_maximo: 'cupoMaximo' })
    return Object.keys(deCampos).length > 0 ? setErrores(deCampos) : push(mensajeDeError(error, 'No se pudo guardar el grupo.'), 'warn')
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setErrores({})
    const datos = aDatosDeGrupo(borrador)
    if (grupo) {
      actualizar.mutate(
        { grupo, cambios: datos },
        {
          onSuccess: (guardado) => {
            push(`Grupo actualizado: ${guardado.nombre}`)
            alTerminar()
          },
          onError: alFallar,
        },
      )
    } else {
      crear.mutate(datos, {
        onSuccess: (creado) => {
          setBorrador(BORRADOR_VACIO)
          push(`Grupo creado: ${creado.nombre}`)
          alTerminar()
        },
        onError: alFallar,
      })
    }
  }

  return (
    <form className="card form" onSubmit={enviar} noValidate aria-label={grupo ? 'Editar grupo' : 'Crear grupo'}>
      <h3>{grupo ? `Editar: ${grupo.nombre}` : 'Crear grupo'}</h3>
      <div className="row2">
        <label>
          Nombre *
          <input value={borrador.nombre} onChange={(e) => cambiar('nombre', e.target.value)} maxLength={100} />
          <Error_ texto={errores.nombre} />
        </label>
        <label>
          Horario
          <input value={borrador.horario} onChange={(e) => cambiar('horario', e.target.value)} maxLength={200} />
        </label>
      </div>
      <label>
        Descripción
        <textarea rows={2} value={borrador.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} />
      </label>
      <div className="row2">
        <label>
          Cupo máximo
          <input inputMode="numeric" value={borrador.cupo} onChange={(e) => cambiar('cupo', e.target.value)} placeholder="Sin límite" />
          <Error_ texto={errores.cupoMaximo} />
        </label>
        <label className="check">
          <input type="checkbox" checked={borrador.activo} onChange={(e) => cambiar('activo', e.target.checked)} />
          <span>Visible para las familias (activo)</span>
        </label>
      </div>
      <div className="btns">
        <button className="btn" disabled={pendiente}>
          {pendiente ? 'Guardando…' : grupo ? 'Guardar cambios' : 'Crear grupo'}
        </button>
        {grupo && (
          <button type="button" className="btn outline" onClick={alTerminar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

function AdministradoresDelGrupo({ grupo, candidatos }: { grupo: GrupoAdministrable; candidatos: CuentaDeUsuario[] }) {
  const { push } = useToast()
  const asignar = useAsignarAdministradores()

  const alternar = (id: number, marcado: boolean) => {
    const ids = marcado ? [...grupo.administradorIds, id] : grupo.administradorIds.filter((x) => x !== id)
    asignar.mutate(
      { grupoId: grupo.id, administradorIds: ids },
      { onSuccess: () => push('Administradores actualizados'), onError: (error) => push(mensajeDeError(error, 'No se pudo asignar.'), 'warn') },
    )
  }

  if (candidatos.length === 0) {
    return <p className="muted-p">Crea una cuenta con rol “Administrador de grupo” para poder asignarla.</p>
  }
  return (
    <fieldset className="admins">
      <legend>Administran este grupo</legend>
      {candidatos.map((c) => (
        <label key={c.id} className="check">
          <input
            type="checkbox"
            disabled={asignar.isPending}
            checked={grupo.administradorIds.includes(c.id)}
            onChange={(e) => alternar(c.id, e.target.checked)}
          />
          <span>{[c.nombres, c.apellidos].filter(Boolean).join(' ') || c.nombreUsuario}</span>
        </label>
      ))}
    </fieldset>
  )
}

function PanelDeGrupos() {
  const { grupos, cargando, error } = useGruposAdministrables()
  const { usuarios } = useUsuarios()
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const editando = grupos.find((g) => g.id === editandoId) ?? null
  const candidatos = usuarios.filter((u) => u.rol === 'administrador_grupo' && u.activo)

  return (
    <>
      <FormularioDeGrupo key={editando?.id ?? 'nuevo'} grupo={editando} alTerminar={() => setEditandoId(null)} />
      <section className="card">
        <h3>Grupos extracurriculares</h3>
        {cargando && <p className="muted-p">Cargando grupos…</p>}
        {error && <p className="muted-p">No pudimos cargar los grupos. Intenta de nuevo más tarde.</p>}
        {!cargando && grupos.length === 0 && <p className="muted-p">Todavía no hay grupos.</p>}
        <div className="grid2">
          {grupos.map((g) => (
            <article key={g.id} className="card inner" aria-label={`Grupo ${g.nombre}`}>
              <h4>
                {g.nombre} <span className={`badge ${g.activo ? 'aprobada' : 'rechazada'}`}>{g.activo ? 'Activo' : 'Inactivo'}</span>
              </h4>
              <p className="muted-p">
                {g.horario || 'Sin horario'} · {g.cupoMaximo === null ? 'Sin límite de cupo' : `Cupo ${g.cupoMaximo}`}
              </p>
              <AdministradoresDelGrupo grupo={g} candidatos={candidatos} />
              <button className="btn outline" onClick={() => setEditandoId(g.id)}>
                Editar
              </button>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

// ------------------------------------------------------------------ Página

type Pestana = 'usuarios' | 'grupos'

/** RF-20: panel del administrador general para gestionar usuarios, roles y grupos. */
export default function PanelAdministracionPage() {
  const [pestana, setPestana] = useState<Pestana>('usuarios')
  return (
    <>
      <p className="kicker">ADMINISTRACIÓN</p>
      <h1 className="ptitle">Usuarios, roles y grupos</h1>
      <p className="sub">
        Crea cuentas, cambia roles, desactiva accesos y atiende las solicitudes de supresión de datos (Ley 1581). También administras los
        grupos extracurriculares y quién los gestiona.
      </p>
      <div className="ftabs" role="tablist">
        <button role="tab" aria-selected={pestana === 'usuarios'} className={pestana === 'usuarios' ? 'on' : ''} onClick={() => setPestana('usuarios')}>
          Usuarios
        </button>
        <button role="tab" aria-selected={pestana === 'grupos'} className={pestana === 'grupos' ? 'on' : ''} onClick={() => setPestana('grupos')}>
          Grupos
        </button>
      </div>
      {pestana === 'usuarios' ? <PanelDeUsuarios /> : <PanelDeGrupos />}
    </>
  )
}
