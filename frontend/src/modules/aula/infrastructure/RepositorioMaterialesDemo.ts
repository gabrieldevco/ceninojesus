import type { Material, RepositorioMateriales } from '../domain/material'

const MATERIALES_DEMO: Record<string, Material[]> = {
  Ajedrez: [
    { id: 1, tipo: 'doc', titulo: 'Guía: el tablero y las piezas', detalle: 'PDF · 6 páginas · Publicado: 01 oct 2026', etiqueta: 'Documento', accion: 'Consultar documento' },
    { id: 2, tipo: 'video', titulo: 'Cómo se mueve cada pieza', detalle: 'Video · 08:20 min · Publicado: 02 oct 2026', etiqueta: 'Video', accion: 'Ver video' },
    { id: 3, tipo: 'link', titulo: 'Explora posiciones de apertura', detalle: 'Recurso externo · Publicado: 02 oct 2026', etiqueta: 'Enlace', accion: 'Consultar enlace' },
  ],
  'Danza y arte': [
    { id: 4, tipo: 'doc', titulo: 'Ritmos y compases: introducción', detalle: 'PDF · 4 páginas · Publicado: 01 oct 2026', etiqueta: 'Documento', accion: 'Consultar documento' },
    { id: 5, tipo: 'video', titulo: 'Calentamiento en 10 minutos', detalle: 'Video · 10:00 min · Publicado: 02 oct 2026', etiqueta: 'Video', accion: 'Ver video' },
  ],
}

/** Material de demostración; se reemplaza por el repositorio HTTP (RF-12, RF-15). */
export class RepositorioMaterialesDemo implements RepositorioMateriales {
  listarPorGrupo(grupo: string): Promise<Material[]> {
    return Promise.resolve(MATERIALES_DEMO[grupo] ?? [])
  }
}
