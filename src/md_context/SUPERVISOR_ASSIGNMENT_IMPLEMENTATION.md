# Asignación de Supervisor a Usuarios

## ✅ Implementación Completada

Se ha agregado la funcionalidad para asignar un supervisor a cualquier usuario desde la página de edición de usuarios.

---

## 📝 Cambios Realizados

### 1. Tipos Actualizados

**src/types/index.ts**
- ✅ `supervisor_id?: string` - ID del supervisor asignado
- ✅ `supervisor?: User` - Datos completos del supervisor (cuando se incluye en la respuesta)

### 2. Servicio de Usuarios

**src/services/users.service.ts**
- ✅ `UpdateUserData.supervisor_id?: string | null` - Permite asignar, cambiar o remover supervisor

### 3. Nuevo Componente

**src/features/settings/components/users/SupervisorSelector.tsx**
- ✅ Selector dropdown de supervisores disponibles
- ✅ Filtra solo usuarios activos
- ✅ Excluye al usuario actual (evita auto-asignación)
- ✅ Opción "Sin supervisor asignado" para remover supervisor
- ✅ Muestra: Nombre completo - Email (Rol)

### 4. Formulario de Usuario

**src/features/settings/components/UserForm.tsx**
- ✅ Campo supervisor visible **solo en modo edición** (no en creación)
- ✅ Validación con Zod schema
- ✅ Envío de `supervisor_id` en PATCH request
- ✅ Soporte para `null` (remover supervisor)

---

## 🎯 Flujo de Uso

### Asignar Supervisor:
1. Ir a `/settings/users`
2. Click en ✏️ Editar usuario
3. Seleccionar supervisor del dropdown
4. Guardar → Envía `PATCH /api/v1/users/{user_id}` con `{ "supervisor_id": "UUID" }`

### Remover Supervisor:
1. Editar usuario
2. Seleccionar "Sin supervisor asignado"
3. Guardar → Envía `{ "supervisor_id": null }`

---

## 🔧 Endpoint Backend

```http
PATCH /api/v1/users/{user_id}
Content-Type: application/json
Authorization: Bearer <TOKEN_ADMIN>

{
  "supervisor_id": "UUID_DEL_SUPERVISOR"  // o null para remover
}
```

---

## 📋 Validaciones

- ✅ Usuario no puede ser su propio supervisor
- ✅ Solo usuarios activos en el selector
- ✅ Campo opcional (puede estar sin supervisor)
- ✅ Soporte para null (remover asignación)

---

## 🎨 UI

- **Ubicación:** Formulario de edición, después del campo "Rol"
- **Visible:** Solo en modo edición (no en crear usuario)
- **Formato:** Dropdown con usuarios disponibles
- **Texto de ayuda:** "Opcional: Asignar un supervisor para este usuario"

---

## 🧪 Testing

- [ ] Asignar supervisor a usuario nuevo
- [ ] Cambiar supervisor existente
- [ ] Remover supervisor (seleccionar "Sin supervisor")
- [ ] Verificar que usuario actual no aparece en lista
- [ ] Verificar que solo usuarios activos aparecen
- [ ] Verificar envío correcto al backend

---

## 💡 Notas

- El campo solo aparece al **editar**, no al crear usuarios
- Si el backend retorna el objeto `supervisor`, se mostrará en futuras implementaciones
- El selector carga todos los usuarios activos (considerar paginación si crece mucho)
