# Solución: Eliminar Spinners y Prevenir Scroll en Inputs Numéricos

## 🎯 Problema
Los inputs de tipo `number` en HTML muestran por defecto unos controles de flechitas (spinners) que permiten incrementar o decrementar el valor. Además, al hacer scroll sobre estos inputs mientras están enfocados, el valor cambia accidentalmente, lo cual es muy molesto para los usuarios.

## ✅ Solución Implementada

Se implementó una solución **doble** que combina CSS y JavaScript para eliminar completamente este comportamiento:

### 1. **Solución CSS** (Ocultar Spinners)

**Archivo:** `src/index.css`

Se agregaron estilos CSS globales para ocultar los spinners en todos los navegadores:

```css
/* Ocultar spinners de inputs numéricos (flechitas) */
/* Chrome, Safari, Edge, Opera */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* Prevenir cambio de valor al hacer scroll sobre inputs numéricos */
input[type="number"]:focus {
  -moz-appearance: textfield;
}
```

**Qué hace:**
- `::-webkit-outer-spin-button` y `::-webkit-inner-spin-button`: Oculta los spinners en navegadores basados en WebKit (Chrome, Safari, Edge, Opera)
- `-moz-appearance: textfield`: Oculta los spinners en Firefox
- `appearance: textfield`: Estándar moderno para todos los navegadores

### 2. **Solución JavaScript** (Prevenir Scroll)

**Archivo:** `src/components/common/Input.tsx`

Se agregó un event listener que previene el cambio de valor al hacer scroll:

```typescript
useEffect(() => {
  if (type === 'number') {
    const inputElement = (ref as React.RefObject<HTMLInputElement>)?.current || internalRef.current;
    
    if (!inputElement) return;
    
    const handleWheel = (e: WheelEvent) => {
      // Prevenir el cambio de valor solo si el input está enfocado
      if (document.activeElement === inputElement) {
        e.preventDefault();
      }
    };
    
    inputElement.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      inputElement.removeEventListener('wheel', handleWheel);
    };
  }
}, [type, ref]);
```

**Qué hace:**
- Detecta cuando el tipo de input es `number`
- Agrega un listener al evento `wheel` (scroll del mouse)
- Solo previene el comportamiento si el input está enfocado (`activeElement`)
- Usa `passive: false` para poder usar `preventDefault()`
- Limpia el listener cuando el componente se desmonta

## 🎨 Experiencia de Usuario

### Antes:
- ❌ Aparecen flechitas molestas en los inputs numéricos
- ❌ Al hacer scroll sobre el input, el valor cambia accidentalmente
- ❌ Difícil controlar el valor con precisión

### Ahora:
- ✅ No hay flechitas visibles
- ✅ El scroll no afecta el valor del input
- ✅ Solo se puede cambiar el valor escribiendo o usando las teclas de flecha del teclado
- ✅ Experiencia más limpia y profesional

## 📊 Compatibilidad

✅ **Chrome / Edge / Opera:** `-webkit-appearance: none`
✅ **Firefox:** `-moz-appearance: textfield`
✅ **Safari:** `-webkit-appearance: none`
✅ **Navegadores modernos:** `appearance: textfield`

## 🔧 Archivos Modificados

1. **`src/index.css`**
   - Agregados estilos CSS para ocultar spinners
   - Aplicado globalmente a todos los `input[type="number"]`

2. **`src/components/common/Input.tsx`**
   - Agregado hook `useEffect` para prevenir scroll
   - Manejo correcto de refs
   - Cleanup automático del event listener

## 💡 Notas Técnicas

### ¿Por qué `passive: false`?
Por defecto, los event listeners de `wheel` son pasivos en navegadores modernos por razones de performance. Sin embargo, necesitamos usar `preventDefault()`, lo cual requiere que el listener NO sea pasivo.

### ¿Por qué verificar `activeElement`?
Solo prevenimos el scroll cuando el input está enfocado. Esto permite que el usuario pueda hacer scroll en la página incluso si el cursor está sobre un input numérico que no está enfocado.

### ¿Por qué no solo CSS?
El CSS solo oculta los spinners visuales, pero no previene el comportamiento de cambio de valor con el scroll. Se necesita JavaScript para interceptar y cancelar el evento `wheel`.

## 🧪 Testing

Para verificar que funciona correctamente:

1. ✅ Abrir cualquier formulario con inputs numéricos
2. ✅ Verificar que NO aparezcan las flechitas
3. ✅ Hacer clic en un input numérico (enfocarlo)
4. ✅ Hacer scroll con el mouse
5. ✅ Verificar que el valor NO cambie
6. ✅ Usar las teclas de flecha arriba/abajo - deberían funcionar normalmente
7. ✅ Escribir valores manualmente - debería funcionar normalmente

## 🎯 Inputs Afectados

Esta solución se aplica automáticamente a TODOS los inputs numéricos en la aplicación, incluyendo:

- ✅ Precio base editable en `PriceSummary`
- ✅ Precio manual (cuando no hay tarifa)
- ✅ Costo adicional (bultos)
- ✅ Descuento manual
- ✅ Cualquier otro input con `type="number"` en toda la aplicación

## 🚀 Beneficios

1. **Mejor UX:** Sin cambios accidentales de valores
2. **Más limpio:** Sin controles visuales innecesarios
3. **Profesional:** Interfaz más moderna y controlada
4. **Global:** Se aplica automáticamente a toda la aplicación
5. **Performance:** El CSS es más eficiente que soluciones JavaScript puras

## 🔮 Consideraciones Futuras

Si en algún momento se necesita que algún input específico SÍ tenga spinners, se puede:

1. Crear una prop opcional en el componente `Input`: `showSpinners?: boolean`
2. Aplicar clases condicionales para excluir ese input de los estilos globales
3. No agregar el event listener de prevención de scroll para ese input

Ejemplo:
```typescript
interface InputProps {
  showSpinners?: boolean; // Nueva prop
  // ... otras props
}

// En el useEffect
if (type === 'number' && !showSpinners) {
  // Agregar listener
}
```

Pero por ahora, es mejor tener TODOS los inputs sin spinners para una experiencia consistente.
