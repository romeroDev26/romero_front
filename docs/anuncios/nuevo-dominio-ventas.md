# Anuncio: nueva dirección del sistema

Preparado el 20 de octubre de 2026. Borrador; no se ha publicado en la base de datos.

- Título: Nueva dirección del sistema de ventas
- Versión: `2026.10.20-dominio`
- Plataforma: WEB
- Imagen: `/images/updates/nuevo-dominio-ventas.png`
- Enlace: `https://ventas.globalromero.com/login`
- Botón visible: **Abrir nuevo sistema** (abre otra pestaña)
- Activa: desmarcada al cargar la plantilla.
- Obligatoria: marcada. Conserva el recordatorio suave existente hasta pulsar Entendido.

## Publicación

1. Desplegar estos cambios para servir la imagen y la plantilla.
2. Configurar `ventas.globalromero.com` en el proyecto de hosting y su DNS. Verificar certificado HTTPS, inicio de sesión, acceso a la API, CORS y WebSocket desde ese origen. No basta con que cargue la página de login.
3. En Administración del Sistema → Novedades → Nueva Novedad, pulsar **Usar anuncio: nueva dirección del sistema**.
4. Revisar fecha de lanzamiento. La fecha de la plantilla es de preparación, no una fecha de migración prometida al personal.
5. Cuando el nuevo acceso esté comprobado, marcar Activa y crear la novedad. Desactivar la anterior como indicó Jonny.
6. Mantener el enlace antiguo disponible durante la transición. Una redirección automática futura se configura aparte; no forma parte de este anuncio.

El personal usa sus credenciales habituales, pero tendrá que iniciar sesión en el nuevo dominio. Las sesiones y preferencias locales no se transfieren automáticamente entre dominios; las novedades pueden volver a aparecer allí. No anunciar que la web pública de compras ya está disponible.

## Guía para Chrome en Windows

Abrir el nuevo enlace → pulsar estrella o Ctrl + D → nombre Romero Ventas, carpeta Barra de favoritos → Listo. Si la barra está oculta, Ctrl + Mayús + B.

Referencia: https://support.google.com/chrome/answer/157179?co=GENIE.Platform%3DDesktop&hl=es-419

## Imagen

Generada con la herramienta integrada image_gen. Los ejemplos de Chrome son ilustrativos. Prompt de producción: infografía horizontal en español para personal de Global Romero; azul marino, azul y amarillo, dominio ventas.globalromero.com destacado, dirección anterior transportes-romero.vercel.app, cuatro pasos con primeros planos de Chrome: abrir enlace, estrella junto a dirección (Ctrl + D), guardar Romero Ventas en Barra de favoritos y pulsar Listo, entrar desde el favorito (Ctrl + Mayús + B para mostrar barra). Indicar que se conservan las credenciales y distinguir el sistema de trabajo de globalromero.com, futura web para clientes. No inventar fecha de lanzamiento ni anunciar compras públicas disponibles.
