# Organizador de Cartón

Aplicación web estática de presentación y simulación académica para un organizador de escritorio de cartón. Reúne su modelo geométrico, piezas, área de material, plan de corte, costos de producción y una propuesta de clasificación y registro de sobrantes.

## Tecnologías

- HTML5
- CSS3 adaptable, incluidos estilos para impresión A4
- JavaScript nativo
- `localStorage` del navegador para conservar los registros de sobrantes

No requiere frameworks, dependencias, backend ni conexión a servicios externos.
Los diagramas técnicos se dibujan en SVG dentro de la página; `assets/` queda disponible para recursos estáticos adicionales.

## Ejecutar

1. Abre `index.html` directamente en un navegador moderno, o abre la carpeta en Visual Studio Code y ejecuta `index.html` con Live Server si está disponible.
2. Usa la navegación superior para consultar **Modelo geométrico**, **Costos** y **Propuesta**. El logotipo y el enlace del pie regresan al inicio.
3. En **Costos**, modifica la cantidad de producción o el presupuesto para actualizar los resultados.
4. En **Propuesta**, ingresa sobrantes y expórtalos como CSV. Los registros quedan guardados en el almacenamiento local de ese navegador y equipo.
5. Selecciona **Imprimir informe** y, en el diálogo del navegador, imprime o guarda como PDF.

## Publicar en GitHub Pages

Sube `index.html`, `styles.css`, `script.js`, `README.md`, `.gitignore` y la carpeta `assets` al repositorio. En la configuración del repositorio, habilita GitHub Pages para la rama y carpeta que contienen `index.html`. Los recursos usan rutas relativas; no se necesita proceso de compilación.

## Datos académicos

Las dimensiones, los cálculos geométricos y los costos unitarios se mantienen fijos. Los costos son estimaciones académicas, no cotizaciones comerciales. La distribución y las áreas de sobrantes son teóricas y no representan mediciones de un corte físico real.
