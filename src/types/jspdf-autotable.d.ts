// src/types/jspdf-autotable.d.ts

/**
 * jspdf-autotable escribe `lastAutoTable` en la instancia de jsPDF despues de
 * dibujar una tabla, y los generadores de PDF leen `lastAutoTable.finalY` para
 * saber donde continuar. La libreria (v5) no declara esa propiedad en sus
 * tipos, asi que en todo el proyecto se accedia con `(pdf as any)`.
 *
 * Esta ampliacion de modulo la declara una sola vez y elimina esos casts.
 */
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      /** Coordenada Y donde termino la ultima tabla dibujada. */
      finalY: number
    }
  }
}
